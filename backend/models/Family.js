import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    familyEmails: [{
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        name: String,
        relationship: String,
        isVerified: {
            type: Boolean,
            default: false
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    settings: {
        receiveSOSAlerts: { type: Boolean, default: true },
        receiveLocationUpdates: { type: Boolean, default: true },
        receiveEmotionUpdates: { type: Boolean, default: true },
        notificationSound: { type: Boolean, default: true }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
familySchema.index({ userId: 1 });
familySchema.index({ "familyEmails.email": 1 });

export default mongoose.model('Family', familySchema);