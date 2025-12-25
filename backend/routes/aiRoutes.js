import express from "express";
import {
  checkIntent,
  detectEmotion,
  predictCrime,
  analyzeLocation,
  debugLocation,
  chatWithAI,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/check-intent", checkIntent);
router.post("/emotion", detectEmotion);
router.post("/predict-crime", predictCrime);
router.post("/analyze-location", analyzeLocation);
router.post("/debug-location", debugLocation);
router.post("/conversation", chatWithAI);

export default router;
