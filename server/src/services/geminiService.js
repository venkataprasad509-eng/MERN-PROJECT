
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
];

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error) {
  const status = error.status || error.statusCode || error.code;
  const message = String(error.message || '');

  return (
    [429, 500, 502, 503, 504, 'UNAVAILABLE'].includes(status) ||
    /high demand|temporarily unavailable|overloaded/i.test(message)
  );
}

async function askGemini(question, history = []) {
  const contents = history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const config = {
    systemInstruction: `
      You are LearnHub AI, a helpful educational and general-purpose assistant.

      Your responsibilities:
      1. Answer programming and technical questions in simple English.
      2. Explain difficult concepts step by step with examples.
      3. Help students understand their course topics and clarify doubts.
      4. Answer general questions politely and clearly.
      5. If a question is unclear, ask the user for clarification.
      6. Never claim that you performed an action that you did not perform.
      7. Keep answers relevant to the user's question.

      Your goal is to help LearnHub students learn and communicate effectively.
    `,
  };

  let lastError;

  for (const model of MODELS) {
    // Two attempts per model: original request + one retry.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        const answer = response.text;

        if (!answer || typeof answer !== 'string') {
          throw new Error('Gemini returned an empty response.');
        }

        console.log(`Gemini response successful using ${model}`);

        return answer;
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini error (${model}, attempt ${attempt + 1}):`,
          error.message
        );

        if (!isRetryableError(error)) {
          throw error;
        }

        if (attempt === 0) {
          console.log('Retrying after 2 seconds...');
          await delay(2000);
        }
      }
    }

    console.log(`Switching to the next Gemini model...`);
  }

  throw lastError || new Error('All Gemini models are currently unavailable.');
}

module.exports = { askGemini };
