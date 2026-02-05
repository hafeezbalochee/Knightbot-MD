const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function gemini(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'models/gemini-2.5-flash'
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = gemini;
