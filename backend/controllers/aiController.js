import axios from "axios";

// AI Service URL - Production deployment
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://cybersakhi.onrender.com";

console.log("🤖 AI Service URL:", AI_SERVICE_URL);


export const checkIntent = async(req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ intent: "none", confidence: 0 });

        // Call Python AI service for active voice detection
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/active-voice`, {
            text: text.toLowerCase(),
        });

        const trigger = aiResponse.data.trigger;

        if (trigger === "triggered") {
            return res.json({ intent: "sos", confidence: 0.95 });
        }

        return res.json({ intent: "none", confidence: 0.2 });
    } catch (error) {
        console.error("AI Intent Error:", error);
        // Fallback to keyword matching if AI service is down
        const SOS_KEYWORDS = [
            "help", "save me", "bachao", "madat", "madat kara", "help me", "save", "sos", "bachao mujhe", "bachao mera", "emergency", "please help"
        ];
        const t = text.toLowerCase();
        const found = SOS_KEYWORDS.some((k) => t.includes(k));
        if (found) {
            return res.json({ intent: "sos", confidence: 0.95 });
        }
        return res.json({ intent: "none", confidence: 0.2 });
    }
};

export const detectEmotion = async(req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ emotion: "neutral" });

        // Call Python AI service for emotion detection
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/emotion`, {
            text: text.toLowerCase(),
        });

        return res.json({ emotion: aiResponse.data.emotion });
    } catch (error) {
        console.error("AI Emotion Detection Error:", error);
        // Fallback to keyword matching if AI service is down
        const text_lower = text.toLowerCase();

        if (["happy", "good", "great", "awesome", "fine", "okay", "confident", "safe"].some(word => text_lower.includes(word))) {
            return res.json({ emotion: "happy" });
        } else if (["sad", "bad", "terrible", "awful", "depressed", "down", "unhappy", "low"].some(word => text_lower.includes(word))) {
            return res.json({ emotion: "sad" });
        } else if (["angry", "mad", "furious", "rage", "frustrated", "annoyed", "irritated"].some(word => text_lower.includes(word))) {
            return res.json({ emotion: "angry" });
        } else if (["scared", "afraid", "fear", "terrified", "anxious", "worried", "panic", "nervous"].some(word => text_lower.includes(word))) {
            return res.json({ emotion: "scared" });
        } else if (["distress", "crisis", "emergency", "help", "danger", "threat", "unsafe"].some(word => text_lower.includes(word))) {
            return res.json({ emotion: "distressed" });
        } else {
            return res.json({ emotion: "neutral" });
        }
    }
};

export const predictCrime = async(req, res) => {
    try {
        const { lat, lon, time_of_day, weather, user_profile, location_name, area_type } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!lat || !lon || !time_of_day || !weather || !user_profile) {
            return res.status(400).json({ error: "Missing required fields: lat, lon, time_of_day, weather, user_profile" });
        }

        // Call Python AI service for crime prediction
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/predict-crime`, {
            lat,
            lon,
            time_of_day,
            weather,
            user_profile,
            location_name,
            area_type
        });

        const predictionResult = aiResponse.data;

        // 🔹 NEW: Store analysis in database if user is authenticated
        if (userId) {
            try {
                const analysisData = {
                    userId: userId,
                    location: {
                        coordinates: { latitude: lat, longitude: lon },
                        address: {
                            formatted: location_name || `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
                            city: "Unknown City",
                            area: "Current Area"
                        },
                        areaType: area_type || "unknown"
                    },
                    riskAssessment: {
                        riskScore: predictionResult.score,
                        riskLevel: predictionResult.risk === "low" ? "Low Risk" : 
                                  predictionResult.risk === "moderate" ? "Moderate Risk" : "High Risk",
                        safetyIndex: predictionResult.score,
                        confidence: predictionResult.confidence
                    },
                    crimeData: {
                        totalCrimesFound: predictionResult.real_crime_analysis?.crime_data_found || 0,
                        crimeRate: predictionResult.real_crime_analysis?.area_crime_rate || "Unknown",
                        mostCommonCrime: predictionResult.real_crime_analysis?.most_common_crime || "Unknown",
                        recentIncidents: predictionResult.real_crime_analysis?.recent_incidents || 0,
                        isHotspot: predictionResult.real_crime_analysis?.is_hotspot || false,
                        crimeDensity: predictionResult.csv_insights?.crime_density || 0,
                        crimeBreakdown: predictionResult.real_crime_analysis?.crime_breakdown || {}
                    },
                    contextualFactors: {
                        timeOfDay: time_of_day,
                        weather: weather,
                        userProfile: user_profile,
                        hour: new Date().getHours(),
                        dayOfWeek: new Date().getDay()
                    },
                    riskFactors: predictionResult.risk_factors || [],
                    recommendations: predictionResult.recommendations || [],
                    dataSources: ["csv_crime_data", "contextual_analysis"],
                    dataQuality: {
                        csvDataUsed: !!predictionResult.csv_insights,
                        csvRecordsFound: predictionResult.real_crime_analysis?.crime_data_found || 0,
                        realDataConfidence: predictionResult.real_crime_analysis?.data_confidence || 0.5,
                        analysisMethod: predictionResult.csv_insights ? "CSV_Enhanced" : "Contextual_Only"
                    },
                    deviceInfo: {
                        userAgent: req.headers['user-agent'] || "Unknown",
                        platform: "Web"
                    }
                };

                // Store via crime analysis API
                await axios.post(`${process.env.BACKEND_URL || "https://cybersakhi-backend.vercel.app"}/crime-analysis/store-test`, analysisData);
                
                console.log(`✅ Crime prediction stored for user ${userId}: ${predictionResult.risk}`);
                predictionResult.database_stored = true;
                
            } catch (dbError) {
                console.error("⚠️ Database storage failed:", dbError.message);
                predictionResult.database_stored = false;
                predictionResult.database_error = "Storage failed but analysis completed";
            }
        }

        return res.json(predictionResult);
    } catch (error) {
        console.error("AI Crime Prediction Error:", error);
        // Fallback response remains critical
        return res.json({
            risk: "moderate",
            score: 4, // Updated score to reflect a fallback scenario
            recommendations: [
                "AI service is currently unavailable.",
                "Stay in well-lit and populated areas.",
                "Be cautious and aware of your surroundings.",
                "Keep emergency contacts readily available."
            ],
            database_stored: false,
            error: "Prediction service unavailable"
        });
    }
};

export const analyzeLocation = async (req, res) => {
    try {
        const { coordinates, accuracy, timestamp, userId, hour, day_of_week, time_of_day } = req.body;
        
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
            return res.status(400).json({ error: "Coordinates are required" });
        }

        const { latitude, longitude } = coordinates;

        // Call Python AI service for location analysis
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/analyze-location`, {
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy || 10,
            timestamp: timestamp || new Date().toISOString(),
            hour: hour || new Date().getHours(),
            day_of_week: day_of_week || new Date().getDay(),
            time_of_day: time_of_day || getTimeOfDay(new Date().getHours())
        });

        return res.json(aiResponse.data);
    } catch (error) {
        console.error("AI Location Analysis Error:", error);
        
        // Enhanced fallback response with better structure
        const hour = req.body.hour || new Date().getHours();
        const timeOfDay = req.body.time_of_day || getTimeOfDay(hour);
        
        return res.json({
            safety_score: getSafetyScoreFallback(hour, timeOfDay),
            risk_level: getRiskLevelFallback(hour, timeOfDay),
            risk_factors: getRiskFactorsFallback(hour, timeOfDay),
            recommendations: getRecommendationsFallback(hour, timeOfDay),
            area_type: "unknown",
            address_info: {
                formatted_address: `Location: ${req.body.coordinates.latitude.toFixed(4)}, ${req.body.coordinates.longitude.toFixed(4)}`,
                components: {
                    city: "Your City",
                    neighbourhood: "Current Area"
                }
            },
            weather: {
                condition: "clear",
                temperature: null
            },
            confidence_score: 0.5,
            timestamp: new Date().toISOString()
        });
    }
};

// Helper functions for fallback responses
const getTimeOfDay = (hour) => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
};

const getSafetyScoreFallback = (hour, timeOfDay) => {
    if (timeOfDay === "night") return 4;
    if (timeOfDay === "evening") return 6;
    return 7;
};

const getRiskLevelFallback = (hour, timeOfDay) => {
    if (timeOfDay === "night") return "High Risk";
    if (timeOfDay === "evening") return "Moderate Risk";
    return "Low Risk";
};

const getRiskFactorsFallback = (hour, timeOfDay) => {
    const factors = ["AI service unavailable"];
    if (timeOfDay === "night") factors.push("Late night hours");
    if (timeOfDay === "evening") factors.push("Evening hours");
    return factors;
};

const getRecommendationsFallback = (hour, timeOfDay) => {
    const recommendations = [
        "Stay aware of your surroundings",
        "Keep emergency contacts ready"
    ];
    
    if (timeOfDay === "night") {
        recommendations.push("Use well-lit routes");
        recommendations.push("Avoid isolated areas");
    } else if (timeOfDay === "evening") {
        recommendations.push("Be extra cautious");
        recommendations.push("Share your location with trusted contacts");
    }
    
    return recommendations;
};

export const debugLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        
        console.log("🔍 DEBUG LOCATION REQUEST:", {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date().toISOString()
        });

        // Try to get address information
        try {
            const response = await axios.get(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            console.log("🌍 GEOCODING RESULT:", response.data);
            
            return res.json({
                coordinates: { latitude, longitude },
                accuracy,
                geocoding: response.data,
                timestamp: new Date().toISOString(),
                status: "success"
            });
        } catch (geocodingError) {
            console.error("❌ Geocoding failed:", geocodingError.message);
            
            return res.json({
                coordinates: { latitude, longitude },
                accuracy,
                geocoding: null,
                error: "Geocoding service unavailable",
                timestamp: new Date().toISOString(),
                status: "partial"
            });
        }
    } catch (error) {
        console.error("❌ Debug location error:", error);
        return res.status(500).json({ error: "Debug location failed" });
    }
};

export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/conversation`, {
            user_input: message,
            chat_history: [],
        });

        res.json({ reply: aiResponse.data.reply });

    } catch (error) {
        console.error("AI Service Error:", error);
        res.status(500).json({ error: "Failed to get response from AI" });
    }
};