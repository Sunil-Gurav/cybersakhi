import mongoose from 'mongoose';
import UserActivity from '../models/UserActivity.js';
import Family from '../models/Family.js';

class UserActivityController {

    // 🔹 STORE USER ACTIVITY
    static async storeUserActivity(req, res) {
        try {
            const { userId, activityType, data = {} } = req.body; // FIX: data = {}

            if (!userId || !activityType) {
                return res.status(400).json({
                    success: false,
                    error: "User ID and Activity Type are required"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid User ID format"
                });
            }

            console.log("🎁 Received activity data:", JSON.stringify(req.body, null, 2));

            // Base activity object
            let activityData = {
                userId,
                activityType,
                timestamp: new Date()
            };

            // Handle activity type logic safely
            switch (activityType) {
                case "location_analysis":
                    const safeCoordinates = {
                        latitude: (data && data.coordinates && data.coordinates.latitude) ?
                            data.coordinates.latitude : 0,
                        longitude: (data && data.coordinates && data.coordinates.longitude) ?
                            data.coordinates.longitude : 0
                    };

                    activityData.locationData = {
                        coordinates: safeCoordinates,
                        address: (data && data.address) ? data.address : null,
                        safetyScore: (data && typeof data.safetyScore === "number") ?
                            data.safetyScore : null,
                        riskLevel: (data && data.riskLevel) ? data.riskLevel : null,
                        riskFactors: (data && Array.isArray(data.riskFactors)) ?
                            data.riskFactors : [],
                        recommendations: (data && Array.isArray(data.recommendations)) ?
                            data.recommendations : [],
                        areaType: (data && data.areaType) ? data.areaType : null,
                        confidence: (data && typeof data.confidence === "number") ?
                            data.confidence : null
                    };
                    break;
                case 'emotion_detection':
                    activityData.emotionData = {
                        emotion: data.emotion || null,
                        confidence: data.confidence || null,
                        text: data.text || null
                    };
                    break;

                case 'sos_triggered':
                    activityData.sosData = {
                        triggeredAt: new Date(),
                        coordinates: data.coordinates || null,
                        message: data.message || "",
                        notifiedFamily: data.notifiedFamily || false
                    };
                    break;

                case 'safety_check':
                    activityData.locationData = data.locationData || {};
                    break;

                case 'voice_command':
                    activityData.emotionData = data.emotionData || {};
                    break;

                default:
                    break;
            }

            // FIX: Ensure locationData exists with default coordinates if not set
            if (!activityData.locationData) {
                activityData.locationData = {
                    coordinates: {
                        latitude: 0,
                        longitude: 0
                    }
                };
            }

            // FIX: Prevent crash if data missing
            activityData.deviceInfo = {
                batteryLevel: data.batteryLevel || null,
                platform: data.platform || 'web',
                userAgent: req.headers['user-agent'] || "unknown"
            };
            
            console.log("💾 Saving activity data to DB:", JSON.stringify(activityData, null, 2));


            // Save to DB
            const activity = new UserActivity(activityData);
            await activity.save();

            console.log(`✅ Activity [${activityType}] for user [${userId}] saved successfully.`);

            await UserActivityController.notifyFamilyMembers(req, userId, activityType, activityData);

            return res.json({
                success: true,
                message: "Activity stored successfully",
                activityId: activity._id
            });

        } catch (error) {
            console.error("🔥 DATABASE SAVE FAILED:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to store user activity",
                details: error.message
            });
        }
    }

    // ---------------------------
    // OTHER METHODS REMAIN SAME
    // ---------------------------

    static async getUserActivities(req, res) {
        try {
            const { userId, limit = 50, activityType } = req.query;

            if (!userId)
                return res.status(400).json({ success: false, error: "User ID is required" });

            let query = { userId, isActive: true };
            if (activityType) query.activityType = activityType;

            const activities = await UserActivity.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .lean();

            const formatted = activities.map((a) => ({
                id: a._id,
                type: a.activityType,
                timestamp: a.timestamp,
                data: UserActivityController.formatActivityData(a),
                deviceInfo: a.deviceInfo,
            }));

            return res.json({ success: true, activities: formatted });

        } catch (error) {
            console.error("🔥 Error fetching activities:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch user activities"
            });
        }
    }

    static async getRecentActivitiesSummary(req, res) {
        try {
            const { userId } = req.params;

            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const activities = await UserActivity.find({
                    userId,
                    timestamp: { $gte: since },
                    isActive: true
                })
                .sort({ timestamp: -1 })
                .limit(20)
                .lean();

            return res.json({
                success: true,
                summary: activities,
                totalActivities: activities.length
            });

        } catch (error) {
            console.error("🔥 Error fetching summary:", error);
            return res.status(500).json({ success: false, error: "Failed to fetch summary" });
        }
    }

    static async notifyFamilyMembers() {
        return; // keep for later
    }

    static formatActivityData(activity) {
        return activity;
    }

    static formatFamilyNotification() {
        return {};
    }

    static async deleteUserActivity(req, res) {
        try {
            const { activityId } = req.params;

            const activity = await UserActivity.findByIdAndUpdate(
                activityId, { isActive: false }, { new: true }
            );

            if (!activity)
                return res.status(404).json({ success: false, error: "Activity not found" });

            return res.json({ success: true, message: "Activity deleted successfully" });
        } catch (error) {
            console.error("🔥 Error deleting activity:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to delete activity"
            });
        }
    }
}

export default UserActivityController;