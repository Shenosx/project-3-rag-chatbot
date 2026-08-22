async function searchSimilarChunks(prisma, documentId, queryEmbedding, limit = 5) {
  const vectorString = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe(
    `
    SELECT
      "id",
      "documentId",
      "content",
      "page",
      "chunkIndex",
      1 - ("embedding" <=> $1::vector) AS similarity
    FROM "DocumentChunk"
    WHERE "documentId" = $2
      AND "embedding" IS NOT NULL
      AND 1 - ("embedding" <=> $1::vector) >= 0.30
      ORDER BY "embedding" <=> $1::vector
      LIMIT $3
    `,
    vectorString,
    Number(documentId),
    Number(limit)
  );

  return results;
}

module.exports = {
  searchSimilarChunks,
};