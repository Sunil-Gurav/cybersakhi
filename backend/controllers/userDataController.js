// backend/controllers/userDataController.js
import UserData from "../models/UserData.js";
import UserLocation from "../models/UserLocation.js";
import UserSafetyMetrics from "../models/UserSafetyMetrics.js";
import User from "../models/User.js";
import UserActivity from "../models/UserActivity.js";

// DIFFERENT VERSION: NO OPTIONAL CHAINING ANYWHERE
const getUserIdFromRequest = (req) => {
  // First try to get from authenticated user
  if (req.user && req.user.id) return req.user.id;
  if (req.user && req.user._id) return req.user._id;
  
  // Fallback to body/params (for cases where auth might not be working)
  if (req.body && req.body.userId) return req.body.userId;
  if (req.params && req.params.userId) return req.params.userId;
  
  return null;
};

const getEmotionDisplay = (emotion) => {
  const map = {
    happy: "😊 Happy",
    sad: "😢 Sad",
    angry: "😠 Angry",
    scared: "😨 Scared",
    distressed: "😰 Distressed",
    neutral: "😐 Neutral",
  };
  return map[emotion] || "😐 Neutral";
};

// Update user emotion
export const updateUserEmotion = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { emotion } = req.body;

    if (!userId)
      return res.status(401).json({ error: "Authentication required" });
    if (!emotion) return res.status(400).json({ error: "Emotion is required" });

    const emotionDisplay = getEmotionDisplay(emotion);

    const updated = await UserData.findOneAndUpdate(
      { userId },
      {
        emotion,
        emotionDisplay,
        lastActivity: new Date(),
      },
      { upsert: true, new: true }
    );

    updateSafetyMetrics(userId, "emotion", { emotion }).catch(console.error);

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update emotion error:", err);
    return res.status(500).json({ error: "Failed to update emotion" });
  }
};

// Update user location with enhanced storage and upsert logic - SIMPLIFIED
export const updateUserLocation = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    
    console.log("🔍 Location update request received");
    console.log("🔍 userId extracted:", userId);
    
    const {
      coordinates,
      address = {},
      accuracy = 0,
      areaType = "unknown",
    } = req.body;

    if (!userId) {
      console.log("❌ No userId found - returning 401");
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (
      !coordinates ||
      typeof coordinates.lat !== "number" ||
      typeof coordinates.lon !== "number"
    ) {
      console.log("❌ Invalid coordinates:", coordinates);
      return res.status(400).json({ error: "Valid coordinates are required" });
    }

    console.log("📍 Storing location for user:", userId, coordinates);

    // Update UserData with latest location snapshot (address only)
    const updated = await UserData.findOneAndUpdate(
      { userId },
      {
        lastLocation: {
          coordinates,
          address,
          accuracy,
          timestamp: new Date(),
        },
        lastActivity: new Date(),
      },
      { upsert: true, new: true }
    );

    // 🔹 Check for recent location entries to prevent duplicates
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const existingLocation = await UserLocation.findOne({
      userId: userId,
      timestamp: { $gte: tenMinutesAgo },
      'coordinates.lat': { 
        $gte: coordinates.lat - 0.001, 
        $lte: coordinates.lat + 0.001 
      },
      'coordinates.lon': { 
        $gte: coordinates.lon - 0.001, 
        $lte: coordinates.lon + 0.001 
      }
    }).sort({ timestamp: -1 });

    let locationDoc;
    let isLocationUpdate = false;

    if (existingLocation) {
      // Update existing location entry
      console.log(`🔄 Updating existing location entry for user ${userId}`);
      
      existingLocation.coordinates = coordinates;
      existingLocation.address = {
        house: address.house || "",
        road: address.road || "",
        neighbourhood: address.neighbourhood || address.area || "",
        suburb: address.suburb || "",
        city: address.city || "",
        state: address.state || "",
        country: address.country || "",
        postcode: address.postcode || "",
        fullAddress: address.formatted || address.formattedAddress || "",
      };
      existingLocation.accuracy = accuracy;
      existingLocation.areaType = areaType;
      existingLocation.timestamp = new Date();
      
      locationDoc = await existingLocation.save();
      isLocationUpdate = true;
      
      console.log("✅ Location entry updated in UserLocation history");
    } else {
      // Create new location entry
      console.log(`➕ Creating new location entry for user ${userId}`);
      
      locationDoc = new UserLocation({
        userId,
        coordinates,
        address: {
          house: address.house || "",
          road: address.road || "",
          neighbourhood: address.neighbourhood || address.area || "",
          suburb: address.suburb || "",
          city: address.city || "",
          state: address.state || "",
          country: address.country || "",
          postcode: address.postcode || "",
          fullAddress: address.formatted || address.formattedAddress || "",
        },
        accuracy,
        areaType,
        timestamp: new Date(),
      });
      
      await locationDoc.save();
      console.log("✅ New location entry stored in UserLocation history");
    }

    // Emit real-time update to family members via Socket.IO (address only)
    const io = req.app?.get("io");
    if (io) {
      io.to(`user-${userId}`).emit("location-update", {
        userId,
        coordinates,
        address,
        timestamp: new Date(),
      });
      console.log("📡 Location update emitted to family members");
    }

    return res.json({ 
      success: true, 
      data: updated,
      message: isLocationUpdate ? "Location updated successfully" : "Location stored successfully",
      isUpdate: isLocationUpdate
    });
  } catch (err) {
    console.error("Update location error:", err);
    return res.status(500).json({ error: "Failed to update location" });
  }
};

// Update safety data
export const updateUserSafety = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const {
      crimeRisk = "Low Risk",
      riskScore = 1,
      safetyScore = 7,
      riskFactors = [],
      recommendations = [],
    } = req.body;

    if (!userId)
      return res.status(401).json({ error: "Authentication required" });

    const updated = await UserData.findOneAndUpdate(
      { userId },
      {
        crimeRisk,
        riskScore,
        safetyScore,
        riskFactors,
        recommendations,
        lastActivity: new Date(),
      },
      { upsert: true, new: true }
    );

    updateSafetyMetrics(userId, "risk", {
      risk: crimeRisk,
      score: riskScore,
      factors: riskFactors,
    }).catch(console.error);

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update safety error:", err);
    return res.status(500).json({ error: "Failed to update safety data" });
  }
};

// Update battery level
export const updateBatteryLevel = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { batteryLevel = "" } = req.body;

    if (!userId)
      return res.status(401).json({ error: "Authentication required" });

    const updated = await UserData.findOneAndUpdate(
      { userId },
      { batteryLevel, lastActivity: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update battery error:", err);
    return res.status(500).json({ error: "Failed to update battery level" });
  }
};

// Get user data
export const getUserData = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json({ error: "Authentication required" });

        // 1. Get the base user data snapshot
        const userData = await UserData.findOne({ userId }).populate(
            "userId",
            "name email"
        ).lean(); // Use .lean() for a plain JS object

        // 2. Get the latest emotion activity
        const latestEmotionActivity = await UserActivity.findOne({
            userId,
            activityType: 'emotion_detection'
        }).sort({ timestamp: -1 });

        // Create a mutable data object to return
        const dataToReturn = userData || {};

        // 3. If a recent emotion exists, overwrite the snapshot's emotion
        if (latestEmotionActivity && latestEmotionActivity.emotionData) {
            const latestEmotion = latestEmotionActivity.emotionData.emotion;
            dataToReturn.emotion = latestEmotion;
            dataToReturn.emotionDisplay = getEmotionDisplay(latestEmotion);
        } else if (dataToReturn.emotion) {
            // Ensure emotionDisplay is consistent if only snapshot data is available
            dataToReturn.emotionDisplay = getEmotionDisplay(dataToReturn.emotion);
        }

        // 4. Determine online status based on last activity
        if (dataToReturn.lastActivity) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            dataToReturn.isOnline = new Date(dataToReturn.lastActivity) > fiveMinutesAgo;
        } else {
            dataToReturn.isOnline = false;
        }

        // Handle case where no data exists at all
        if (!userData && !latestEmotionActivity) {
             const user = await User.findById(userId).select('name email').lean();
             if(user){
                return res.json({ success: true, data: { userId: user, isOnline: false } , message: "No data yet" });
             }
             return res.json({ success: true, data: null, message: "No data yet" });
        }


        return res.json({ success: true, data: dataToReturn });
    } catch (err) {
        console.error("Get user data error:", err);
        return res.status(500).json({ error: "Failed to get user data" });
    }
};


// Family user data
export const getFamilyUserData = async (req, res) => {
  try {
    const familyEmail = req.query.familyEmail;
    if (!familyEmail)
      return res.status(400).json({ error: "familyEmail is required" });

    const familyUsers = await User.find({
      $or: [{ email: familyEmail }, { "familyMembers.email": familyEmail }],
    });

    if (!familyUsers || familyUsers.length === 0)
      return res.json({ success: true, users: [] });

    const userIds = familyUsers.map((u) => u._id);
    const usersData = await UserData.find({
      userId: { $in: userIds },
    }).populate("userId", "name email");

    return res.json({ success: true, users: usersData });
  } catch (err) {
    console.error("Get family user data error:", err);
    return res.status(500).json({ error: "Failed to get family user data" });
  }
};

// Location history
export const getUserLocationHistory = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId)
      return res.status(401).json({ error: "Authentication required" });

    const { limit = 50, startDate, endDate } = req.query;
    const query = { userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const locations = await UserLocation.find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(200, parseInt(limit)));

    return res.json({ success: true, locations });
  } catch (err) {
    console.error("Get location history error:", err);
    return res.status(500).json({ error: "Failed to get location history" });
  }
};

// Safety metrics
export const getUserSafetyMetrics = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId)
      return res.status(401).json({ error: "Authentication required" });

    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = await UserSafetyMetrics.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.json({ success: true, metrics: metrics || null });
  } catch (err) {
    console.error("Get safety metrics error:", err);
    return res.status(500).json({ error: "Failed to get safety metrics" });
  }
};

// Safety metrics updater
const updateSafetyMetrics = async (userId, type, data) => {
  try {
    if (!userId) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let metrics = await UserSafetyMetrics.findOne({ userId, date: today });
    if (!metrics) {
      metrics = new UserSafetyMetrics({ userId, date: today });
    }

    switch (type) {
      case "emotion":
        metrics.emotionHistory = metrics.emotionHistory || [];
        metrics.emotionHistory.push({
          emotion: data.emotion,
          timestamp: new Date(),
        });
        break;

      case "location":
        metrics.locationHistory = metrics.locationHistory || [];
        metrics.locationHistory.push({
          coordinates: data.coordinates,
          timestamp: new Date(),
          safetyScore: data.safetyScore || 7,
        });
        break;

      case "risk":
        metrics.riskHistory = metrics.riskHistory || [];
        metrics.riskHistory.push({
          risk: data.risk,
          score: data.score,
          timestamp: new Date(),
          factors: data.factors || [],
        });
        break;
    }

    await metrics.save();
  } catch (err) {
    console.error("Update safety metrics error:", err);
  }
};

// Get latest location for family dashboard
export const getLatestUserLocation = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 getLatestUserLocation called for userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get latest location from UserLocation history
    const latestLocation = await UserLocation.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean();

    console.log("🔍 Latest location from UserLocation:", latestLocation);

    // Get user data snapshot for additional info
    const userData = await UserData.findOne({ userId })
      .populate("userId", "name email")
      .lean();

    console.log("🔍 UserData found:", userData);

    if (!latestLocation && !userData?.lastLocation) {
      console.log("⚠️ No location data found for user:", userId);
      return res.json({
        success: true,
        location: null,
        message: "No location data found"
      });
    }

    // Prefer UserLocation history over snapshot
    const locationData = latestLocation || {
      coordinates: userData.lastLocation?.coordinates,
      address: userData.lastLocation?.address,
      accuracy: userData.lastLocation?.accuracy,
      timestamp: userData.lastLocation?.timestamp,
    };

    console.log("🔍 Final location data to return:", locationData);

    const response = {
      success: true,
      location: {
        coordinates: locationData.coordinates,
        address: {
          formatted: locationData.address?.fullAddress || locationData.address?.formatted,
          city: locationData.address?.city,
          area: locationData.address?.neighbourhood || locationData.address?.area,
          state: locationData.address?.state,
          country: locationData.address?.country,
        },
        accuracy: locationData.accuracy,
        areaType: locationData.areaType,
        safetyIndicators: locationData.safetyIndicators,
        timestamp: locationData.timestamp,
        safetyScore: userData?.safetyScore,
        riskLevel: userData?.crimeRisk,
        riskFactors: userData?.riskFactors,
        recommendations: userData?.recommendations,
      },
      user: userData?.userId
    };

    console.log("✅ Returning location response:", response);
    return res.json(response);

  } catch (error) {
    console.error("❌ Get latest location error:", error);
    return res.status(500).json({ error: "Failed to get latest location" });
  }
};

// Get user location history for family dashboard
export const getUserLocationHistoryForFamily = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, hours = 24 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get locations from the last N hours
    const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000);

    const locations = await UserLocation.find({
      userId,
      timestamp: { $gte: timeLimit }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

    return res.json({
      success: true,
      locations: locations.map(loc => ({
        coordinates: loc.coordinates,
        address: {
          formatted: loc.address?.fullAddress,
          city: loc.address?.city,
          area: loc.address?.neighbourhood,
          state: loc.address?.state,
          country: loc.address?.country,
        },
        accuracy: loc.accuracy,
        areaType: loc.areaType,
        timestamp: loc.timestamp,
      })),
      count: locations.length
    });

  } catch (error) {
    console.error("Get location history error:", error);
    return res.status(500).json({ error: "Failed to get location history" });
  }
};