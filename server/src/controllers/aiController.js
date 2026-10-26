const { askGemini } = require("../services/geminiService");

async function askAI(req, res) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a question.",
      });
    }

    const answer = await askGemini(question);

    res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Gemini API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to generate an AI response.",
    });
  }
}

module.exports = { askAI };