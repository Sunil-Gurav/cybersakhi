import express from "express";
import {
    storeCrimeAnalysis,
    getUserAnalysisHistory,
    getLatestAnalysis,
    getUserHotspots,
    getAreaStatistics,
    enhancedCrimePrediction,
    getUserRiskTrends,
    cleanupOldAnalyses
} from "../controllers/crimeAnalysisController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Store crime analysis (protected route)
router.post("/store", protect, storeCrimeAnalysis);

// Store crime analysis (test route - unprotected)
router.post("/store-test", storeCrimeAnalysis);

// Enhanced crime prediction with database storage
router.post("/predict-enhanced", enhancedCrimePrediction);

// Enhanced crime prediction with auth
router.post("/predict-enhanced-auth", protect, enhancedCrimePrediction);

// Get user's analysis history
router.get("/history/:userId", getUserAnalysisHistory);
router.get("/history", protect, getUserAnalysisHistory);

// Get latest analysis
router.get("/latest/:userId", getLatestAnalysis);
router.get("/latest", protect, getLatestAnalysis);

// Get user's hotspot areas
router.get("/hotspots/:userId", getUserHotspots);
router.get("/hotspots", protect, getUserHotspots);

// Get area statistics
router.get("/area-stats", getAreaStatistics);

// Get user's risk trends
router.get("/trends/:userId", getUserRiskTrends);
router.get("/trends", protect, getUserRiskTrends);

// Cleanup old analyses (admin route)
router.delete("/cleanup", cleanupOldAnalyses);

export default router;