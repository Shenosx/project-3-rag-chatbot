import { encodingForModel } from "js-tiktoken";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embed } from "../../lib/embedder";
import { searchSimilarChunks } from "../../lib/vectorSearch";
import { streamRAGResponse } from "../../lib/claudeRAG";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const encoding = encodingForModel("gpt-4o");
const MAX_CONTEXT_TOKENS = 6000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { documentId, query } = req.body;

    if (!documentId || !query) {
      return res.status(400).json({
        error: "documentId and query are required",
      });
    }

    // 1. Convert user question into an embedding
    const queryEmbedding = await embed(query);

    // 2. Retrieve top 5 relevant chunks
    const chunks = await searchSimilarChunks(
      prisma,
      Number(documentId),
      queryEmbedding,
      5
    );

    // 3. Build context
    const contextParts = [];
    let contextTokens = 0;

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];

      const sourceText =
        `[Source ${index + 1} | Chunk ${chunk.chunkIndex}]\n${chunk.content}`;

      const tokens = encoding.encode(sourceText).length;

      if (contextTokens + tokens > MAX_CONTEXT_TOKENS) {
        break;
      }

      contextParts.push(sourceText);
      contextTokens += tokens;
  }

    const context = contextParts.join("\n\n");

    // 4. Start SSE response
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    // Send retrieved sources first
    res.write(
      `event: sources\ndata: ${JSON.stringify(
        chunks.map((chunk) => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          similarity: Number(chunk.similarity),
        }))
      )}\n\n`
    );

    const stream = await streamRAGResponse(query, context);

    stream.on("text", (text) => {
      res.write(
        `event: message\ndata: ${JSON.stringify({
          text,
        })}\n\n`
      );
    });

    stream.on("end", () => {
      res.write(`event: done\ndata: {}\n\n`);
      res.end();
    });

    stream.on("error", (error) => {
      console.error("Claude streaming error:", error);

      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: "Claude streaming failed",
        })}\n\n`
      );

      res.end();
    });
  } catch (error) {
    console.error("Chat error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to answer question",
        details: error.message,
      });
    }

    res.write(
      `event: error\ndata: ${JSON.stringify({
        error: error.message,
      })}\n\n`
    );

    res.end();
  }
}