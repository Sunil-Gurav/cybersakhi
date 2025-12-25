import mongoose from "mongoose";

const userSafetyMetricsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
        // Removed index: true to avoid duplicate with compound index below
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    emotionHistory: [{
        emotion: {
            type: String,
            enum: ["happy", "sad", "angry", "scared", "distressed", "neutral"]
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        context: String
    }],
    locationHistory: [{
        coordinates: {
            lat: Number,
            lon: Number
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        safetyScore: Number
    }],
    riskHistory: [{
        risk: String,
        score: Number,
        timestamp: {
            type: Date,
            default: Date.now
        },
        factors: [String]
    }],
    sosTriggers: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        location: {
            lat: Number,
            lon: Number
        },
        reason: String
    }],
    dailyStats: {
        totalLocationsTracked: {
            type: Number,
            default: 0
        },
        emotionChanges: {
            type: Number,
            default: 0
        },
        riskAssessments: {
            type: Number,
            default: 0
        },
        averageSafetyScore: {
            type: Number,
            default: 7
        }
    },
    weeklyStats: {
        totalLocationsTracked: {
            type: Number,
            default: 0
        },
        emotionChanges: {
            type: Number,
            default: 0
        },
        riskAssessments: {
            type: Number,
            default: 0
        },
        averageSafetyScore: {
            type: Number,
            default: 7
        },
        sosIncidents: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
userSafetyMetricsSchema.index({ userId: 1, date: -1 });
userSafetyMetricsSchema.index({ userId: 1, createdAt: -1 });

// TTL index to keep metrics for 90 days
userSafetyMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model("UserSafetyMetrics", userSafetyMetricsSchema);