import mongoose from "mongoose";

const crimeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Location Information
  location: {
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: {
      formatted: String,
      city: String,
      area: String,
      state: String,
      country: String,
      neighbourhood: String
    },
    accuracy: Number,
    areaType: String
  },
  
  // Analysis Results
  riskAssessment: {
    riskScore: { type: Number, min: 1, max: 10 },
    riskLevel: { 
      type: String, 
      enum: ['Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'] 
    },
    safetyIndex: { type: Number, min: 1, max: 10 },
    confidence: { type: Number, min: 0, max: 1 }
  },
  
  // Crime Data Analysis
  crimeData: {
    totalCrimesFound: { type: Number, default: 0 },
    crimeRate: { 
      type: String, 
      enum: ['Very Low', 'Low', 'Moderate', 'High', 'Very High', 'Unknown'] 
    },
    mostCommonCrime: String,
    crimeFrequency: Number,
    crimeDensity: Number,
    crimeBreakdown: {
      type: Map,
      of: Number
    },
    recentIncidents: Number,
    isHotspot: { type: Boolean, default: false },
    hotspotRiskFactor: Number
  },
  
  // Contextual Factors
  contextualFactors: {
    timeOfDay: { 
      type: String, 
      enum: ['morning', 'afternoon', 'evening', 'night'] 
    },
    weather: String,
    userProfile: { 
      type: String, 
      enum: ['alone', 'with_friends', 'family', 'public_transport', 'vehicle', 'indoor_public'] 
    },
    hour: Number,
    dayOfWeek: Number
  },
  
  // Risk Factors and Recommendations
  riskFactors: [String],
  recommendations: [String],
  
  // Data Sources and Quality
  dataSources: [String],
  dataQuality: {
    csvDataUsed: { type: Boolean, default: false },
    csvRecordsFound: Number,
    realDataConfidence: Number,
    analysisMethod: String
  },
  
  // Analysis Metadata
  analysisTimestamp: { type: Date, default: Date.now },
  analysisVersion: { type: String, default: "2.0" },
  
  // User Activity Context
  deviceInfo: {
    userAgent: String,
    platform: String,
    batteryLevel: String
  },
  
  // Family Sharing
  sharedWithFamily: { type: Boolean, default: true },
  familyNotified: { type: Boolean, default: false }
  
}, {
  timestamps: true,
  collection: 'crimeanalyses'
});

// Indexes for better performance
crimeAnalysisSchema.index({ userId: 1, analysisTimestamp: -1 });
crimeAnalysisSchema.index({ "location.coordinates.latitude": 1, "location.coordinates.longitude": 1 });
crimeAnalysisSchema.index({ "riskAssessment.riskLevel": 1 });
crimeAnalysisSchema.index({ "crimeData.isHotspot": 1 });

// Virtual for getting latest analysis
crimeAnalysisSchema.virtual('isRecent').get(function() {
  const hoursDiff = (Date.now() - this.analysisTimestamp) / (1000 * 60 * 60);
  return hoursDiff < 24; // Recent if within 24 hours
});

// Method to get risk summary
crimeAnalysisSchema.methods.getRiskSummary = function() {
  return {
    riskScore: this.riskAssessment.riskScore,
    riskLevel: this.riskAssessment.riskLevel,
    location: this.location.address.formatted || `${this.location.coordinates.latitude}, ${this.location.coordinates.longitude}`,
    timestamp: this.analysisTimestamp,
    isHotspot: this.crimeData.isHotspot
  };
};

// Static method to get user's analysis history
crimeAnalysisSchema.statics.getUserAnalysisHistory = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ analysisTimestamp: -1 })
    .limit(limit)
    .select('location riskAssessment crimeData analysisTimestamp');
};

// Static method to get hotspot areas for user
crimeAnalysisSchema.statics.getUserHotspots = function(userId) {
  return this.find({ 
    userId, 
    'crimeData.isHotspot': true 
  })
    .sort({ analysisTimestamp: -1 })
    .limit(5)
    .select('location riskAssessment analysisTimestamp');
};

// Static method to get area statistics
crimeAnalysisSchema.statics.getAreaStatistics = function(lat, lon, radiusKm = 5) {
  // Simple bounding box calculation (for more accuracy, use MongoDB geospatial queries)
  const latDelta = radiusKm / 111; // Rough conversion
  const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  return this.aggregate([
    {
      $match: {
        'location.coordinates.latitude': { 
          $gte: lat - latDelta, 
          $lte: lat + latDelta 
        },
        'location.coordinates.longitude': { 
          $gte: lon - lonDelta, 
          $lte: lon + lonDelta 
        },
        analysisTimestamp: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    },
    {
      $group: {
        _id: null,
        avgRiskScore: { $avg: '$riskAssessment.riskScore' },
        totalAnalyses: { $sum: 1 },
        hotspotCount: { 
          $sum: { $cond: ['$crimeData.isHotspot', 1, 0] } 
        },
        riskLevels: { $push: '$riskAssessment.riskLevel' }
      }
    }
  ]);
};

export default mongoose.model("CrimeAnalysis", crimeAnalysisSchema);