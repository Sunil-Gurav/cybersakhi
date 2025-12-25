import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    messages: [{
        from: {
            type: String,
            enum: ["user", "bot"],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to auto-delete after 7 days (604800 seconds)
chatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;