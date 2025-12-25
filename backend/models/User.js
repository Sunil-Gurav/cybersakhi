// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
        type: String,
        enum: ["sakhi", "family"],
        default: "sakhi",
    },

    // 🔹 NEW: Email verification fields
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: { type: String },
    otpExpires: { type: Date },
    
    // 🔹 NEW: Password reset fields
    passwordResetOTP: { type: String },
    passwordResetExpires: { type: Date },
    
    familyMembers: [{
        name: String,
        email: String,
        relation: String,
    }],

    // Latest Crime Analysis Summary
    latestCrimeAnalysis: {
        analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "CrimeAnalysis" },
        riskScore: { type: Number, min: 1, max: 10 },
        riskLevel: { 
            type: String, 
            enum: ['Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'] 
        },
        location: String,
        timestamp: Date,
        isHotspot: { type: Boolean, default: false }
    },

    // Crime Analysis Preferences
    crimeAnalysisSettings: {
        autoStore: { type: Boolean, default: true },
        shareWithFamily: { type: Boolean, default: true },
        notifyOnHighRisk: { type: Boolean, default: true },
        dataRetentionDays: { type: Number, default: 90 }
    }
}, { timestamps: true });

// Prevent OverwriteModelError during hot reload / nodemon restarts
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;