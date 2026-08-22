import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Anthropic from "@anthropic-ai/sdk";
import { embed } from "../../lib/embedder";
import { searchSimilarChunks } from "../../lib/vectorSearch";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    const context = chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1} | Chunk ${chunk.chunkIndex}]\n${chunk.content}`
      )
      .join("\n\n");

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

    // 5. Ask Claude and stream response
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `You are a helpful document assistant.

Answer the user's question using ONLY the provided document context.

Rules:
- Do not invent information.
- If the answer is not in the context, say so.
- Keep the answer concise.
- When using information from a source, mention [Source 1], [Source 2], etc.

Document context:

${context}`,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    });

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