// backend/controllers/ai/LocationAnalysisController.js
import axios from "axios";

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// In-memory store for tracking sessions
const activeTrackingSessions = new Map();

// Helper functions (defined outside class to avoid 'this' issues)
const getTimeOfDay = (hour) => {
    if (hour >= 5 && hour < 12) {
        return "morning";
    }
    if (hour >= 12 && hour < 17) {
        return "afternoon";
    }
    if (hour >= 17 && hour < 21) {
        return "evening";
    }
    return "night";
};

const getWeatherCondition = (code) => {
    const weatherMap = {
        0: "clear",
        1: "clear",
        2: "partly_cloudy",
        3: "overcast",
        45: "fog",
        48: "fog",
        51: "drizzle",
        53: "drizzle",
        55: "drizzle",
        61: "rain",
        63: "rain",
        65: "heavy_rain",
        80: "rain",
        81: "rain",
        82: "heavy_rain",
        95: "thunderstorm",
        96: "thunderstorm",
        99: "thunderstorm"
    };
    return weatherMap[code] || "unknown";
};

const getBasicPatternAnalysis = () => {
    return {
        frequent_locations: [],
        risk_patterns: [],
        safety_trends: {
            overall_trend: "stable",
            high_risk_periods: ["20:00-02:00"],
            safe_locations: []
        },
        recommendations: [
            "Consider varying your routine for enhanced safety",
            "Avoid high-risk areas during night hours"
        ]
    };
};

class LocationAnalysisController {
    // -----------------------------
    // 🔷 ANALYZE SINGLE LOCATION
    // -----------------------------
    static async analyzeLocation(req, res) {
        try {
            console.log("📍 Location analysis request received");

            const { coordinates, accuracy, timestamp, userId } = req.body;

            if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid coordinates provided"
                });
            }

            const currentTime = new Date();
            const hour = currentTime.getHours();
            const timeOfDay = getTimeOfDay(hour);

            console.log(`📍 Processing location: ${coordinates.latitude}, ${coordinates.longitude} for user: ${userId}`);

            const locationData = {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                accuracy: accuracy,
                timestamp: timestamp,
                user_id: userId,
                time_of_day: timeOfDay,
                hour: hour,
                day_of_week: currentTime.getDay(),
                weather: await LocationAnalysisController.getWeatherData(coordinates.latitude, coordinates.longitude)
            };

            console.log("📍 Sending request to AI service...");

            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/analyze-location`,
                locationData, { timeout: 10000 }
            );

            console.log("✅ AI service response received");

            // Emit real-time update via Socket.IO if available
            if (req.app && req.app.get && req.app.get("io") && userId) {
                const io = req.app.get("io");
                io.to(`user-${userId}`).emit("location-analysis-complete", {
                    safetyScore: aiResponse.data.safety_score,
                    riskLevel: aiResponse.data.risk_level,
                    timestamp: new Date().toISOString()
                });
            }

            return res.json({
                success: true,
                ...aiResponse.data
            });

        } catch (error) {
            console.error("❌ AI Location analysis error:", error.message);

            if (error.code === "ECONNREFUSED" || (error.response && error.response.status >= 500)) {
                console.log("🔄 Using fallback analysis");
                const fallback = await LocationAnalysisController.performBasicAnalysis(req.body);
                return res.json({
                    success: true,
                    fallback: true,
                    ...fallback
                });
            }

            return res.status(500).json({
                success: false,
                error: "Location analysis failed",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 ANALYZE MULTIPLE LOCATIONS
    // -----------------------------
    static async analyzeLocationsBatch(req, res) {
        try {
            const { locations } = req.body;

            if (!Array.isArray(locations) || locations.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "Locations array is required"
                });
            }

            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/analyze-locations-batch`, { locations: locations }
            );

            return res.json({
                success: true,
                ...aiResponse.data
            });
        } catch (error) {
            console.error("❌ Batch analysis error:", error.message);
            return res.status(500).json({
                success: false,
                error: "Batch analysis failed",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 PATTERN ANALYSIS
    // -----------------------------
    static async analyzePatterns(req, res) {
        try {
            const { userId, days = 30 } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const userLocations = await LocationAnalysisController.getUserLocationHistory(userId, days);

            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/analyze-patterns`, {
                    user_id: userId,
                    days: days,
                    locations: userLocations
                }
            );

            return res.json({
                success: true,
                ...aiResponse.data
            });

        } catch (error) {
            console.error("❌ Pattern analysis error:", error.message);

            const basicAnalysis = getBasicPatternAnalysis();
            return res.json({
                success: true,
                fallback: true,
                ...basicAnalysis
            });
        }
    }

    // -----------------------------
    // 🔷 CRIME RISK PREDICTION
    // -----------------------------
    static async predictCrimeRisk(req, res) {
        try {
            const { location, time_of_day, weather, user_profile, coordinates } = req.body;

            const data = {
                location: location,
                time_of_day: time_of_day,
                weather: weather,
                user_profile: user_profile,
                coordinates: coordinates
            };

            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/crime`,
                data
            );

            return res.json({
                success: true,
                ...aiResponse.data
            });

        } catch (error) {
            console.error("❌ Crime prediction error:", error.message);
            return res.status(500).json({
                success: false,
                error: "Crime prediction failed",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 START TRACKING
    // -----------------------------
    static async startLocationTracking(req, res) {
        try {
            const { userId, interval = 30000 } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            activeTrackingSessions.set(userId, {
                userId: userId,
                interval: interval,
                startedAt: new Date(),
                isActive: true
            });

            console.log(`📍 Started location tracking for user: ${userId}`);

            return res.json({
                success: true,
                trackingId: userId,
                message: "Location tracking started",
                interval: interval
            });

        } catch (error) {
            console.error("❌ Start tracking error:", error.message);
            return res.status(500).json({
                success: false,
                error: "Failed to start tracking",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 STOP TRACKING
    // -----------------------------
    static async stopLocationTracking(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const session = activeTrackingSessions.get(userId);
            if (session) {
                activeTrackingSessions.delete(userId);
                console.log(`📍 Stopped location tracking for user: ${userId}`);
            }

            return res.json({
                success: true,
                message: "Location tracking stopped"
            });

        } catch (error) {
            console.error("❌ Stop tracking error:", error.message);
            return res.status(500).json({
                success: false,
                error: "Failed to stop tracking",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 GET USER SAFETY STATUS
    // -----------------------------
    static async getUserSafetyStatus(req, res) {
        try {
            const { userId } = req.params;

            const session = activeTrackingSessions.get(userId);

            return res.json({
                success: true,
                userId: userId,
                isTrackingActive: !!session,
                trackingSession: session || null,
                lastUpdated: session ? session.startedAt : null
            });

        } catch (error) {
            console.error("❌ Get status error:", error.message);
            return res.status(500).json({
                success: false,
                error: "Failed to get safety status",
                details: error.message
            });
        }
    }

    // -----------------------------
    // 🔷 HELPER METHODS
    // -----------------------------
    static async getWeatherData(lat, lon) {
        try {
            const response = await axios.get(
                "https://api.open-meteo.com/v1/forecast", {
                    params: {
                        latitude: lat,
                        longitude: lon,
                        current_weather: true,
                        timezone: "auto"
                    },
                    timeout: 5000
                }
            );

            if (response.status === 200) {
                const data = response.data;
                return {
                    temperature: data.current_weather.temperature,
                    condition: getWeatherCondition(data.current_weather.weathercode)
                };
            } else {
                return { temperature: null, condition: "unknown" };
            }
        } catch (error) {
            console.log("🌤️ Weather API error:", error.message);
            return { temperature: null, condition: "unknown" };
        }
    }

    static async performBasicAnalysis(data) {
        const coordinates = data.coordinates;
        const currentTime = new Date();
        const hour = currentTime.getHours();
        const isNight = hour >= 18 || hour <= 6;

        let safetyScore = 7;
        const riskFactors = [];

        if (isNight) {
            safetyScore = safetyScore - 2;
            riskFactors.push("Night time");
        }

        const areaType = "urban";

        return {
            safety_score: Math.max(1, Math.min(10, safetyScore)),
            risk_level: safetyScore >= 8 ? "Low" : safetyScore >= 5 ? "Medium" : "High",
            risk_factors: riskFactors,
            recommendations: [
                "Stay aware of your surroundings",
                "Keep emergency contacts accessible",
                "Share your live location with trusted people"
            ],
            area_type: areaType,
            address: {
                formatted: `Location (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`
            },
            confidence_score: 0.6,
            weather: {
                condition: "unknown",
                temperature: null
            },
            nearby_incidents: []
        };
    }

    static async getUserLocationHistory(userId, days) {
        // This would query your database for user's location history
        // For now, return mock data
        return [{
            latitude: 28.6139,
            longitude: 77.2090,
            timestamp: new Date().toISOString(),
            safety_score: 7.5
        }];
    }


}

export default LocationAnalysisController;