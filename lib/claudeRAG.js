const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateRAGResponse(query, context) {
  const systemPrompt = `
You are a helpful document assistant.

Answer the user's question using ONLY the provided document context.

If the answer cannot be found in the context, clearly say that the information is not available in the document.

Always cite the relevant sources using [Source 1], [Source 2], etc.

Do not invent or assume information that is not present in the document.
`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `
Document Context:

${context}

Question:
${query}
`,
      },
    ],
  });

  return message.content[0]?.text || "";
}

async function streamRAGResponse(query, context) {
  const systemPrompt = `
You are a helpful document assistant.

Answer the user's question using ONLY the provided document context.

If the answer cannot be found in the context, clearly say that the information is not available in the document.

Always cite the relevant sources using [Source 1], [Source 2], etc.

Do not invent or assume information that is not present in the document.
`;

  return anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `
Document Context:

${context}

Question:
${query}
`,
      },
    ],
  });
}

module.exports = {
  generateRAGResponse,
  streamRAGResponse,
};