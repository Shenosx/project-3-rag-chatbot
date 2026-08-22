import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embed } from "../../lib/embedder";
import { searchSimilarChunks } from "../../lib/vectorSearch";

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
    const { documentId, query } = req.body;

    if (!documentId || !query) {
      return res.status(400).json({
        error: "documentId and query are required",
      });
    }

    const queryEmbedding = await embed(query);

    const results = await searchSimilarChunks(
      prisma,
      Number(documentId),
      queryEmbedding,
      5
    );

    return res.status(200).json({
      success: true,
      query,
      documentId: Number(documentId),
      results,
    });
  } catch (error) {
    console.error("Vector search error:", error);

    return res.status(500).json({
      error: "Failed to search document",
      details: error.message,
    });
  }
}