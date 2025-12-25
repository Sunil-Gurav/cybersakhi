// backend/routes/assistantRoutes.js
import express from "express";
import { chatWithAssistant, getChatHistory } from "../controllers/assistantController.js";

const router = express.Router();

router.post("/chat", chatWithAssistant);
router.get("/history/:sessionId", getChatHistory);

export default router;