import mongoose from "mongoose";

const sosSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: String,
    message: String,
    coords: {
        lat: Number,
        lon: Number,
    },
    createdAt: { type: Date, default: Date.now },
    handled: { type: Boolean, default: false },
});

export default mongoose.model("Sos", sosSchema);