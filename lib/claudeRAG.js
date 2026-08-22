const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getAnswer(query, context) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: `You are a helpful document assistant.

Answer the user's question using ONLY the provided document context.

If the answer cannot be found in the context, say that the information is not available in the uploaded document.

Be concise and factual.`,
    messages: [
      {
        role: "user",
        content: `Document context:

${context}

User question:
${query}`,
      },
    ],
  });

  return message.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("");
}

module.exports = {
  getAnswer,
};