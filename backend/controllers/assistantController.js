import axios from "axios";
import ChatHistory from "../models/ChatHistory.js";
import jwt from "jsonwebtoken";

export const chatWithAssistant = async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt) {
      return res.status(400).json({ reply: "Prompt is required" });
    }

    // ---------- AUTH ----------
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ reply: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const currentSessionId = sessionId || `session_${Date.now()}_${userId}`;

    // ---------- LOAD HISTORY ----------
    const historyDoc = await ChatHistory.findOne({
      userId,
      sessionId: currentSessionId,
    });

    const messages = historyDoc ? historyDoc.messages : [];

    // ---------- AI Service CALL ----------
    const aiResponse = await axios.post("http://localhost:8000/ai/conversation", {
      user_input: prompt,
      chat_history: messages,
    });

    const reply = aiResponse.data.reply;

    // ---------- SAVE ----------
    const updatedMessages = historyDoc ? historyDoc.messages : [];
    updatedMessages.push({ from: "user", text: prompt, timestamp: new Date() });
    updatedMessages.push({ from: "bot", text: reply, timestamp: new Date() });

    await ChatHistory.findOneAndUpdate(
      { userId, sessionId: currentSessionId },
      { userId, sessionId: currentSessionId, messages: updatedMessages },
      { upsert: true }
    );

    res.json({ reply, sessionId: currentSessionId });
  } catch (err) {
    console.error("AI Service Error:", err.message);
    res.status(500).json({ reply: "AI error, please try again" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // ---------- AUTH ----------
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ reply: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // ---------- LOAD HISTORY ----------
    const historyDoc = await ChatHistory.findOne({
      userId,
      sessionId,
    });

    if (!historyDoc) {
      return res.status(404).json({ messages: [] }); // No history found for this session
    }

    res.json({ messages: historyDoc.messages });
  } catch (err) {
    console.error("History Error:", err.message);
    res.status(500).json({ reply: "Error retrieving history" });
  }
};
