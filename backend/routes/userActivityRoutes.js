import express from "express";
import UserActivityController from "../controllers/UserActivityController.js";

const router = express.Router();

router.post("/store-activity", UserActivityController.storeUserActivity);
router.get("/user-activities", UserActivityController.getUserActivities);
router.get("/recent-summary/:userId", UserActivityController.getRecentActivitiesSummary);
router.delete("/activity/:activityId", UserActivityController.deleteUserActivity);

// Test endpoint to debug location activities
router.get("/test-location/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Testing location activities for user:", userId);
    
    // Get all activities for this user
    const allActivities = await UserActivityController.getUserActivities(req, res);
    
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

export default router;