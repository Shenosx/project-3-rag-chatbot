import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { chunkText } from "../../lib/chunker";

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

    const documents = await prisma.$queryRaw`
      SELECT "id", "content"
      FROM "Document"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    if (!documents.length) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    const document = documents[0];

    const textChunks = chunkText(document.content, 500, 100);

    if (textChunks.length === 0) {
      return res.status(400).json({
        error: "Document has no extractable text",
      });
    }

    await prisma.$executeRaw`
      DELETE FROM "DocumentChunk"
      WHERE "documentId" = ${id}
    `;

    const createdChunks = [];

    for (let i = 0; i < textChunks.length; i++) {
      const text = textChunks[i];

      const result = await prisma.$queryRaw`
        INSERT INTO "DocumentChunk"
          ("documentId", "content", "chunkIndex")
        VALUES
          (${id}, ${text}, ${i})
        RETURNING "id", "chunkIndex"
      `;

      createdChunks.push({
        id: result[0].id,
        chunkIndex: result[0].chunkIndex,
        characters: text.length,
      });
    }

    return res.status(200).json({
      success: true,
      documentId: id,
      chunkCount: createdChunks.length,
      chunks: createdChunks,
    });
  } catch (error) {
    console.error("Document processing error:", error);

    return res.status(500).json({
      error: "Failed to process document",
    });
  }
}