import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embedMany } from "../../lib/embedder";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        error: "documentId is required",
      });
    }

    const id = Number(documentId);

    const chunks = await prisma.$queryRaw`
      SELECT "id", "content"
      FROM "DocumentChunk"
      WHERE "documentId" = ${id}
      ORDER BY "chunkIndex" ASC
    `;

    if (chunks.length === 0) {
      return res.status(404).json({
        error: "No chunks found for this document",
      });
    }

    const texts = chunks.map((chunk) => chunk.content);

    const embeddings = await embedMany(texts);

    if (embeddings.length !== chunks.length) {
      throw new Error("Embedding count does not match chunk count");
    }

    for (let i = 0; i < chunks.length; i++) {
      const vector = embeddings[i];

      if (vector.length !== 1536) {
        throw new Error(
          `Unexpected embedding dimensions: ${vector.length}`
        );
      }

      const vectorString = `[${vector.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `
        UPDATE "DocumentChunk"
        SET "embedding" = $1::vector
        WHERE "id" = $2
        `,
        vectorString,
        chunks[i].id
      );
    }

    return res.status(200).json({
      success: true,
      documentId: id,
      embeddedChunks: chunks.length,
      dimensions: 1536,
    });
  } catch (error) {
    console.error("Embedding error:", error);

    return res.status(500).json({
      error: "Failed to generate embeddings",
      details: error.message,
    });
  }
}