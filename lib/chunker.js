const { encodingForModel } = require("js-tiktoken");

const encoding = encodingForModel("gpt-4o");

function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || !text.trim()) {
    return [];
  }

  const tokens = encoding.encode(text);

  const chunks = [];

  let start = 0;

  while (start < tokens.length) {
    const end = Math.min(start + chunkSize, tokens.length);

    const chunkTokens = tokens.slice(start, end);
    const chunkText = encoding.decode(chunkTokens);

    chunks.push(chunkText);

    if (end >= tokens.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

module.exports = {
  chunkText,
};