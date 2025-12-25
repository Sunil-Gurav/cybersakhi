// backend/models/UserData.js
import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
        // Removed index: true to avoid duplicate with compound index below
    },
    emotion: {
        type: String,
        enum: ["happy", "sad", "angry", "scared", "distressed", "neutral"],
        default: "neutral",
    },
    emotionDisplay: { type: String, default: "😐 Neutral" },

    crimeRisk: { type: String, default: "Low Risk" },
    riskScore: { type: Number, min: 1, max: 10, default: 1 },

    batteryLevel: { type: String, default: "" },

    lastLocation: {
        coordinates: { lat: Number, lon: Number },
        address: {
            formatted: String,
            city: String,
            state: String,
            country: String,
        },
        accuracy: Number,
        timestamp: { type: Date, default: Date.now },
    },

    safetyScore: { type: Number, min: 1, max: 10, default: 7 },
    riskFactors: [String],
    recommendations: [String],

    isOnline: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

userDataSchema.index({ userId: 1, createdAt: -1 });
userDataSchema.index({ "lastLocation.coordinates": "2dsphere" });

const UserData = mongoose.models.UserData || mongoose.model("UserData", userDataSchema);
export default UserData;