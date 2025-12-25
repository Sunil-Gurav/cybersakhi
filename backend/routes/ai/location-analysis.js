// backend/routes/ai/location-analysis.js
import express from "express";
import LocationAnalysisController from "../../controllers/ai/LocationAnalysisController.js";

const router = express.Router();

console.log("📌 Location Analysis Routes Loaded");

// -------------------------------
// 🔷 AI-Powered Location Endpoints
// -------------------------------

// Analyze a single location
router.post("/analyze-location", async(req, res) => {
    console.log("📥 /analyze-location called");
    LocationAnalysisController.analyzeLocation(req, res);
});

// Batch location analysis
router.post("/analyze-locations-batch", async(req, res) => {
    console.log("📥 /analyze-locations-batch called");
    LocationAnalysisController.analyzeLocationsBatch(req, res);
});

// Pattern analysis
router.post("/analyze-patterns", async(req, res) => {
    console.log("📥 /analyze-patterns called");
    LocationAnalysisController.analyzePatterns(req, res);
});

// Crime risk prediction
router.post("/predict-crime-risk", async(req, res) => {
    console.log("📥 /predict-crime-risk called");
    LocationAnalysisController.predictCrimeRisk(req, res);
});

// -------------------------------
// 🔷 Real-Time Location Tracking
// -------------------------------

// Start tracking
router.post("/start-location-tracking", async(req, res) => {
    console.log("📥 /start-location-tracking called");
    LocationAnalysisController.startLocationTracking(req, res);
});

// Stop tracking
router.post("/stop-location-tracking", async(req, res) => {
    console.log("📥 /stop-location-tracking called");
    LocationAnalysisController.stopLocationTracking(req, res);
});

// Get user safety status
router.get("/safety-status/:userId", async(req, res) => {
    console.log("📥 /safety-status called for user:", req.params.userId);
    LocationAnalysisController.getUserSafetyStatus(req, res);
});

// -------------------------------
// 🔷 Test Route
// -------------------------------
router.get("/test", (req, res) => {
    console.log("✅ Location analysis test route hit");
    res.json({
        success: true,
        message: "Location analysis controller is working!",
        timestamp: new Date().toISOString(),
    });
});

// -------------------------------

export default router;