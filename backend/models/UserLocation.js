import mongoose from "mongoose";

const userLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
      // Removed index: true to avoid duplicate with compound index below
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      lon: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    address: {
      house: String,
      road: String,
      neighbourhood: String,
      suburb: String,
      city: String,
      state: String,
      country: String,
      postcode: String,
      fullAddress: String,
    },
    areaType: {
      type: String,
      enum: [
        "urban",
        "suburban",
        "rural",
        "commercial",
        "residential",
        "unknown",
      ],
      default: "unknown",
    },
    weather: {
      temperature: Number,
      condition: String,
      timestamp: Date,
    },
    safetyIndicators: [String],
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
userLocationSchema.index({ coordinates: "2dsphere" });
userLocationSchema.index({ userId: 1, timestamp: -1 });

// TTL index to keep location history for 30 days
userLocationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("UserLocation", userLocationSchema);
