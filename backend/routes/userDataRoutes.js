import express from "express";
import {
    updateUserEmotion,
    updateUserLocation,
    updateUserSafety,
    updateBatteryLevel,
    getUserData,
    getFamilyUserData,
    getUserLocationHistory,
    getUserSafetyMetrics,
    getLatestUserLocation,
    getUserLocationHistoryForFamily
} from "../controllers/userDataController.js";
import { protect } from "../middleware/authMiddleware.js";
import UserLocation from "../models/UserLocation.js";
import UserData from "../models/UserData.js";

const router = express.Router();

// Temporary unprotected route for testing location storage
router.post("/location-test", updateUserLocation);

// Temporary unprotected routes for family dashboard testing
router.get("/:userId/location-latest-test", getLatestUserLocation);
router.get("/:userId/location-history-family-test", getUserLocationHistoryForFamily);

// Debug endpoint to check what's stored in database
router.get("/:userId/debug-location", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Debug endpoint called for userId:", userId);
    
    // Check UserLocation collection
    const userLocations = await UserLocation.find({ userId }).sort({ timestamp: -1 }).limit(5);
    console.log("🔍 UserLocation records:", userLocations);
    
    // Check UserData collection
    const userData = await UserData.findOne({ userId });
    console.log("🔍 UserData record:", userData);
    
    // Check UserActivity collection
    const UserActivity = (await import("../models/UserActivity.js")).default;
    const locationActivities = await UserActivity.find({ 
      userId, 
      activityType: "location_analysis" 
    }).sort({ timestamp: -1 }).limit(5);
    console.log("🔍 Location activities:", locationActivities);
    
    res.json({
      success: true,
      debug: {
        userLocations: userLocations.length,
        userData: !!userData,
        locationActivities: locationActivities.length,
        latestUserLocation: userLocations[0] || null,
        userDataSnapshot: userData?.lastLocation || null,
        latestActivity: locationActivities[0] || null
      }
    });
    
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// protect ensures req.user is available
router.use(protect);

// Fixed order — static routes first
router.post("/emotion", updateUserEmotion);
router.post("/location", updateUserLocation);
router.post("/safety", updateUserSafety);
router.post("/battery", updateBatteryLevel);

router.get("/family/users", getFamilyUserData); // must be before :userId

// Dynamic routes last
router.get("/:userId", getUserData);
router.get("/:userId/location-history", getUserLocationHistory);
router.get("/:userId/location-latest", getLatestUserLocation); // New endpoint for family dashboard
router.get("/:userId/location-history-family", getUserLocationHistoryForFamily); // New endpoint for family
router.get("/:userId/safety-metrics", getUserSafetyMetrics);

export default router;