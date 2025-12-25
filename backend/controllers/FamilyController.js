import Family from '../models/Family.js';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';

class FamilyController {

    // 🔹 ADD FAMILY MEMBER
    static async addFamilyMember(req, res) {
        try {
            const { userId, familyEmail, name, relationship } = req.body;

            if (!userId || !familyEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID and family email are required'
                });
            }

            // Find or create family document
            let family = await Family.findOne({ userId });

            if (!family) {
                family = new Family({ userId, familyEmails: [] });
            }

            // Check if email already exists
            const existingEmail = family.familyEmails.find(
                email => email.email.toLowerCase() === familyEmail.toLowerCase()
            );

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Family member already exists'
                });
            }

            // Add new family member
            family.familyEmails.push({
                email: familyEmail.toLowerCase(),
                name: name || '',
                relationship: relationship || 'family'
            });

            family.lastUpdated = new Date();
            await family.save();

            return res.json({
                success: true,
                message: 'Family member added successfully',
                family: {
                    emails: family.familyEmails,
                    settings: family.settings
                }
            });

        } catch (error) {
            console.error('Error adding family member:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to add family member'
            });
        }
    }

    // 🔹 GET FAMILY MEMBERS
    static async getFamilyMembers(req, res) {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
            }

            const family = await Family.findOne({ userId });

            if (!family) {
                return res.json({
                    success: true,
                    familyMembers: [],
                    settings: {}
                });
            }

            return res.json({
                success: true,
                familyMembers: family.familyEmails,
                settings: family.settings
            });

        } catch (error) {
            console.error('Error fetching family members:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch family members'
            });
        }
    }

    // 🔹 REMOVE FAMILY MEMBER
    static async removeFamilyMember(req, res) {
        try {
            const { userId, familyEmail } = req.body;

            if (!userId || !familyEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID and family email are required'
                });
            }

            const family = await Family.findOne({ userId });

            if (!family) {
                return res.status(404).json({
                    success: false,
                    error: 'Family not found'
                });
            }

            // Remove the email
            family.familyEmails = family.familyEmails.filter(
                email => email.email.toLowerCase() !== familyEmail.toLowerCase()
            );

            family.lastUpdated = new Date();
            await family.save();

            return res.json({
                success: true,
                message: 'Family member removed successfully',
                familyMembers: family.familyEmails
            });

        } catch (error) {
            console.error('Error removing family member:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to remove family member'
            });
        }
    }

    // 🔹 UPDATE FAMILY SETTINGS
    static async updateFamilySettings(req, res) {
        try {
            const { userId, settings } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
            }

            let family = await Family.findOne({ userId });

            if (!family) {
                family = new Family({ userId, familyEmails: [] });
            }

            // Update settings
            family.settings = Object.assign({}, family.settings, settings);
            family.lastUpdated = new Date();
            await family.save();

            return res.json({
                success: true,
                message: 'Family settings updated successfully',
                settings: family.settings
            });

        } catch (error) {
            console.error('Error updating family settings:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update family settings'
            });
        }
    }

    // 🔹 GET SAKHI USERS FOR FAMILY DASHBOARD
    static async getSakhiUsers(req, res) {
        try {
            const { familyEmail } = req.query;

            if (!familyEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Family email is required'
                });
            }

            // Find all families that have this email
            const families = await Family.find({
                'familyEmails.email': familyEmail.toLowerCase(),
                'familyEmails.isVerified': true
            }).populate('userId', 'name email phone profilePicture');

            if (!families || families.length === 0) {
                return res.json({
                    success: true,
                    sakhiUsers: []
                });
            }

            // Extract user details
            const sakhiUsers = families.map(family => {
                const familyEmailData = family.familyEmails.find(
                    email => email.email.toLowerCase() === familyEmail.toLowerCase()
                );

                return {
                    id: family.userId && family.userId._id ? family.userId._id : null,
                    name: family.userId && family.userId.name ? family.userId.name : 'Unknown User',
                    email: family.userId && family.userId.email ? family.userId.email : 'No Email',
                    phone: family.userId && family.userId.phone ? family.userId.phone : 'No Phone',
                    profilePicture: family.userId && family.userId.profilePicture ? family.userId.profilePicture : null,
                    relationship: familyEmailData && familyEmailData.relationship ? familyEmailData.relationship : 'family'
                };
            });

            return res.json({
                success: true,
                sakhiUsers: sakhiUsers.filter(user => user.id !== null)
            });

        } catch (error) {
            console.error('Error fetching sakhi users:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch sakhi users'
            });
        }
    }

    // 🔹 GET FAMILY DASHBOARD DATA
    static async getFamilyDashboardData(req, res) {
        try {
            const { familyEmail } = req.query;

            if (!familyEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Family email is required'
                });
            }

            // Get sakhi users
            const families = await Family.find({
                'familyEmails.email': familyEmail.toLowerCase(),
                'familyEmails.isVerified': true
            }).populate('userId', 'name email phone');

            if (!families || families.length === 0) {
                return res.json({
                    success: true,
                    sakhiUsers: [],
                    recentActivities: [],
                    emergencyStatus: 'safe'
                });
            }

            const sakhiUsers = families.map(family => {
                return {
                    id: family.userId && family.userId._id ? family.userId._id : null,
                    name: family.userId && family.userId.name ? family.userId.name : 'Unknown User',
                    email: family.userId && family.userId.email ? family.userId.email : 'No Email',
                    phone: family.userId && family.userId.phone ? family.userId.phone : 'No Phone'
                };
            }).filter(user => user.id !== null);

            // Get recent activities from all connected users
            const userIds = sakhiUsers.map(user => user.id);

            let recentActivities = [];
            if (userIds.length > 0) {
                recentActivities = await UserActivity.find({
                        userId: { $in: userIds },
                        isActive: true,
                        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                    })
                    .sort({ timestamp: -1 })
                    .limit(20)
                    .populate('userId', 'name email')
                    .lean();
            }

            // Format activities for family dashboard
            const formattedActivities = recentActivities.map(activity => {
                const base = {
                    id: activity._id,
                    userName: activity.userId && activity.userId.name ? activity.userId.name : 'Unknown User',
                    type: activity.activityType,
                    timestamp: activity.timestamp
                };

                switch (activity.activityType) {
                    case 'location_analysis':
                        const locationData = activity.locationData || {};
                        const address = locationData.address || {};
                        return {
                            ...base,
                            activity: `Location checked in ${address.city ? address.city : 'unknown area'}`,
                            safetyScore: locationData.safetyScore,
                            riskLevel: locationData.riskLevel
                        };

                    case 'emotion_detection':
                        const emotionData = activity.emotionData || {};
                        return {
                            ...base,
                            activity: `Emotion: ${emotionData.emotion ? emotionData.emotion : 'detected'}`,
                            emotion: emotionData.emotion
                        };

                    case 'sos_triggered':
                        return {
                            ...base,
                            activity: '🚨 EMERGENCY SOS TRIGGERED',
                            isEmergency: true
                        };

                    default:
                        return {
                            ...base,
                            activity: `Activity: ${activity.activityType}`
                        };
                }
            });

            // Check for active SOS
            let hasActiveSOS = false;
            if (recentActivities.length > 0) {
                hasActiveSOS = recentActivities.some(
                    activity => activity.activityType === 'sos_triggered' &&
                    new Date(activity.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                );
            }

            return res.json({
                success: true,
                sakhiUsers: sakhiUsers,
                recentActivities: formattedActivities,
                emergencyStatus: hasActiveSOS ? 'alert' : 'safe',
                lastUpdated: new Date()
            });

        } catch (error) {
            console.error('Error fetching family dashboard data:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch family dashboard data'
            });
        }
    }

    // 🔹 VERIFY FAMILY EMAIL
    static async verifyFamilyEmail(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            // In a real app, you would send a verification email
            // For now, we'll just mark it as verified
            const family = await Family.findOne({
                'familyEmails.email': email.toLowerCase()
            });

            if (!family) {
                return res.status(404).json({
                    success: false,
                    error: 'Family email not found'
                });
            }

            // Update verification status
            const familyEmail = family.familyEmails.find(
                item => item.email.toLowerCase() === email.toLowerCase()
            );

            if (familyEmail) {
                familyEmail.isVerified = true;
                family.lastUpdated = new Date();
                await family.save();
            }

            return res.json({
                success: true,
                message: 'Family email verified successfully'
            });

        } catch (error) {
            console.error('Error verifying family email:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify family email'
            });
        }
    }
}

export default FamilyController;