import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    activityType: {
        type: String,
        required: true,
        enum: ['location_analysis', 'emotion_detection', 'sos_triggered', 'safety_check', 'voice_command']
    },
    locationData: {
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        address: {
            formatted: String,
            city: String,
            area: String,
            state: String,
            country: String
        },
        safetyScore: Number,
        riskLevel: String,
        riskFactors: [String],
        recommendations: [String],
        areaType: String,
        confidence: Number
    },
    emotionData: {
        emotion: String,
        confidence: Number,
        text: String
    },
    sosData: {
        triggeredAt: Date,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        message: String,
        notifiedFamily: Boolean
    },
    deviceInfo: {
        batteryLevel: String,
        userAgent: String,
        platform: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });

export default mongoose.model('UserActivity', userActivitySchema);