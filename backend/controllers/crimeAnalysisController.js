import CrimeAnalysis from "../models/CrimeAnalysis.js";
import User from "../models/User.js";
import axios from "axios";

// Store Crime Analysis in Database with Upsert Logic
export const storeCrimeAnalysis = async (req, res) => {
    try {
        const {
            location,
            riskAssessment,
            crimeData,
            contextualFactors,
            riskFactors,
            recommendations,
            dataSources,
            dataQuality,
            deviceInfo
        } = req.body;

        const userId = req.user?.id || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // 🔹 NEW: Check if there's a recent analysis (within last 10 minutes) to update instead of creating new
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const existingAnalysis = await CrimeAnalysis.findOne({
            userId: userId,
            analysisTimestamp: { $gte: tenMinutesAgo },
            'location.coordinates.latitude': { 
                $gte: location.coordinates.latitude - 0.001, 
                $lte: location.coordinates.latitude + 0.001 
            },
            'location.coordinates.longitude': { 
                $gte: location.coordinates.longitude - 0.001, 
                $lte: location.coordinates.longitude + 0.001 
            }
        }).sort({ analysisTimestamp: -1 });

        let crimeAnalysis;

        if (existingAnalysis) {
            // Update existing analysis
            console.log(`🔄 Updating existing analysis for user ${userId}`);
            
            existingAnalysis.riskAssessment = riskAssessment;
            existingAnalysis.crimeData = crimeData;
            existingAnalysis.contextualFactors = contextualFactors;
            existingAnalysis.riskFactors = riskFactors;
            existingAnalysis.recommendations = recommendations;
            existingAnalysis.dataSources = dataSources;
            existingAnalysis.dataQuality = dataQuality;
            existingAnalysis.deviceInfo = deviceInfo;
            existingAnalysis.analysisTimestamp = new Date();
            
            crimeAnalysis = await existingAnalysis.save();
            
            console.log(`✅ Crime analysis updated for user ${userId}: Risk ${riskAssessment.riskLevel}`);
        } else {
            // Create new crime analysis record
            console.log(`➕ Creating new analysis for user ${userId}`);
            
            crimeAnalysis = new CrimeAnalysis({
                userId,
                location,
                riskAssessment,
                crimeData,
                contextualFactors,
                riskFactors,
                recommendations,
                dataSources,
                dataQuality,
                deviceInfo,
                analysisTimestamp: new Date()
            });

            await crimeAnalysis.save();
            console.log(`✅ New crime analysis created for user ${userId}: Risk ${riskAssessment.riskLevel}`);
        }

        // Update user's latest analysis
        await User.findByIdAndUpdate(userId, {
            $set: {
                'latestCrimeAnalysis': {
                    analysisId: crimeAnalysis._id,
                    riskScore: riskAssessment.riskScore,
                    riskLevel: riskAssessment.riskLevel,
                    location: location.address?.formatted || `${location.coordinates.latitude}, ${location.coordinates.longitude}`,
                    timestamp: new Date(),
                    isHotspot: crimeData.isHotspot
                }
            }
        });

        res.status(201).json({
            success: true,
            message: existingAnalysis ? "Crime analysis updated successfully" : "Crime analysis stored successfully",
            analysisId: crimeAnalysis._id,
            riskSummary: crimeAnalysis.getRiskSummary(),
            isUpdate: !!existingAnalysis
        });

    } catch (error) {
        console.error("❌ Error storing crime analysis:", error);
        res.status(500).json({ 
            error: "Failed to store crime analysis",
            details: error.message 
        });
    }
};

// Get User's Analysis History
export const getUserAnalysisHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const analyses = await CrimeAnalysis.find({ userId })
            .sort({ analysisTimestamp: -1 })
            .skip(skip)
            .limit(limit)
            .select('location riskAssessment crimeData contextualFactors analysisTimestamp');

        const totalCount = await CrimeAnalysis.countDocuments({ userId });

        res.json({
            success: true,
            analyses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasMore: skip + analyses.length < totalCount
            }
        });

    } catch (error) {
        console.error("❌ Error fetching analysis history:", error);
        res.status(500).json({ 
            error: "Failed to fetch analysis history",
            details: error.message 
        });
    }
};

// Get Latest Analysis for User
export const getLatestAnalysis = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const latestAnalysis = await CrimeAnalysis.findOne({ userId })
            .sort({ analysisTimestamp: -1 });

        if (!latestAnalysis) {
            return res.status(404).json({ 
                error: "No analysis found for user" 
            });
        }

        res.json({
            success: true,
            analysis: latestAnalysis,
            riskSummary: latestAnalysis.getRiskSummary()
        });

    } catch (error) {
        console.error("❌ Error fetching latest analysis:", error);
        res.status(500).json({ 
            error: "Failed to fetch latest analysis",
            details: error.message 
        });
    }
};

// Get User's Hotspot Areas
export const getUserHotspots = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const hotspots = await CrimeAnalysis.getUserHotspots(userId);

        res.json({
            success: true,
            hotspots,
            count: hotspots.length
        });

    } catch (error) {
        console.error("❌ Error fetching hotspots:", error);
        res.status(500).json({ 
            error: "Failed to fetch hotspots",
            details: error.message 
        });
    }
};

// Get Area Statistics
export const getAreaStatistics = async (req, res) => {
    try {
        const { lat, lon, radius } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ 
                error: "Latitude and longitude are required" 
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const radiusKm = parseFloat(radius) || 5;

        const areaStats = await CrimeAnalysis.getAreaStatistics(latitude, longitude, radiusKm);

        res.json({
            success: true,
            location: { latitude, longitude, radiusKm },
            statistics: areaStats[0] || {
                avgRiskScore: 6.0,
                totalAnalyses: 0,
                hotspotCount: 0,
                riskLevels: []
            }
        });

    } catch (error) {
        console.error("❌ Error fetching area statistics:", error);
        res.status(500).json({ 
            error: "Failed to fetch area statistics",
            details: error.message 
        });
    }
};

// Enhanced Crime Prediction with Database Storage
export const enhancedCrimePrediction = async (req, res) => {
    try {
        const { lat, lon, time_of_day, weather, user_profile, location_name, area_type } = req.body;
        const userId = req.user?.id || req.body.userId;

        if (!lat || !lon || !time_of_day || !weather || !user_profile) {
            return res.status(400).json({ 
                error: "Missing required fields: lat, lon, time_of_day, weather, user_profile" 
            });
        }

        // Call AI service for crime prediction
        const aiResponse = await axios.post("http://localhost:8000/ai/predict-crime", {
            lat,
            lon,
            time_of_day,
            weather,
            user_profile,
            location_name,
            area_type
        });

        const predictionResult = aiResponse.data;

        // Prepare data for database storage
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

        // Store in database if userId is available
        if (userId) {
            try {
                const crimeAnalysis = new CrimeAnalysis(analysisData);
                await crimeAnalysis.save();

                // Update user's latest analysis
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        'latestCrimeAnalysis': {
                            analysisId: crimeAnalysis._id,
                            riskScore: predictionResult.score,
                            riskLevel: analysisData.riskAssessment.riskLevel,
                            location: analysisData.location.address.formatted,
                            timestamp: new Date(),
                            isHotspot: analysisData.crimeData.isHotspot
                        }
                    }
                });

                console.log(`✅ Enhanced crime analysis stored: ${analysisData.riskAssessment.riskLevel}`);
                
                // Add database info to response
                predictionResult.database_stored = true;
                predictionResult.analysis_id = crimeAnalysis._id;
                
            } catch (dbError) {
                console.error("⚠️ Database storage failed:", dbError);
                predictionResult.database_stored = false;
                predictionResult.database_error = "Storage failed but analysis completed";
            }
        }

        res.json(predictionResult);

    } catch (error) {
        console.error("❌ Enhanced crime prediction error:", error);
        
        // Fallback response
        res.json({
            risk: "moderate",
            score: 5,
            recommendations: [
                "AI service temporarily unavailable",
                "Stay aware of your surroundings",
                "Use well-lit and populated routes"
            ],
            risk_factors: ["Service unavailable"],
            confidence: 0.3,
            database_stored: false,
            error: "Prediction service unavailable"
        });
    }
};

// Get User's Risk Trends
export const getUserRiskTrends = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;
        const days = parseInt(req.query.days) || 30;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await CrimeAnalysis.aggregate([
            {
                $match: {
                    userId: userId,
                    analysisTimestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$analysisTimestamp" } }
                    },
                    avgRiskScore: { $avg: "$riskAssessment.riskScore" },
                    analysisCount: { $sum: 1 },
                    hotspotCount: { $sum: { $cond: ["$crimeData.isHotspot", 1, 0] } }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);

        res.json({
            success: true,
            trends,
            period: `${days} days`,
            totalAnalyses: trends.reduce((sum, day) => sum + day.analysisCount, 0)
        });

    } catch (error) {
        console.error("❌ Error fetching risk trends:", error);
        res.status(500).json({ 
            error: "Failed to fetch risk trends",
            details: error.message 
        });
    }
};

// Delete Old Analyses (Cleanup)
export const cleanupOldAnalyses = async (req, res) => {
    try {
        const daysToKeep = parseInt(req.query.days) || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await CrimeAnalysis.deleteMany({
            analysisTimestamp: { $lt: cutoffDate }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old crime analyses`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} analyses older than ${daysToKeep} days`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("❌ Error cleaning up analyses:", error);
        res.status(500).json({ 
            error: "Failed to cleanup old analyses",
            details: error.message 
        });
    }
};