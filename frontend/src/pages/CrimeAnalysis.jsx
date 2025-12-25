import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CrimePredictor from "../components/CrimePredictor";
import "../styles/CrimeAnalysis.css";
import api from "../api/apiclient";

// Sample data for city analysis
const cityData = [
  { city: "Delhi", crimeRate: 82, safetyIndex: 18, population: 32000000 },
  { city: "Mumbai", crimeRate: 63, safetyIndex: 37, population: 20400000 },
  { city: "Bengaluru", crimeRate: 52, safetyIndex: 48, population: 13200000 },
  { city: "Hyderabad", crimeRate: 41, safetyIndex: 59, population: 10500000 },
  { city: "Pune", crimeRate: 33, safetyIndex: 67, population: 7400000 },
  { city: "Chennai", crimeRate: 27, safetyIndex: 73, population: 11000000 },
  { city: "Ahmedabad", crimeRate: 22, safetyIndex: 78, population: 8300000 },
];

// Time-based crime data
const timeBasedData = [
  { time: "00:00", crimeRate: 45, safetyScore: 3 },
  { time: "03:00", crimeRate: 52, safetyScore: 2 },
  { time: "06:00", crimeRate: 25, safetyScore: 7 },
  { time: "09:00", crimeRate: 15, safetyScore: 8 },
  { time: "12:00", crimeRate: 18, safetyScore: 8 },
  { time: "15:00", crimeRate: 22, safetyScore: 7 },
  { time: "18:00", crimeRate: 35, safetyScore: 6 },
  { time: "21:00", crimeRate: 42, safetyScore: 4 },
];

// Crime type distribution
const crimeTypeData = [
  { name: "Theft", value: 35, color: "#8884d8" },
  { name: "Assault", value: 25, color: "#82ca9d" },
  { name: "Fraud", value: 20, color: "#ffc658" },
  { name: "Vandalism", value: 12, color: "#ff7300" },
  { name: "Others", value: 8, color: "#00ff00" },
];

const CrimeAnalysis = () => {
  const [activeTab, setActiveTab] = useState("predictor");
  const [location, setLocation] = useState("");
  const [currentLocationData, setCurrentLocationData] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [safetyAnalysis, setSafetyAnalysis] = useState(null);
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);

  useEffect(() => {
    // Auto-fetch live location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          setLocation(`${lat},${lon}`);
          setCurrentLocationData({ lat: parseFloat(lat), lon: parseFloat(lon) });
          
          // Automatically analyze current location
          analyzeCurrentLocation(parseFloat(lat), parseFloat(lon));
        },
        () => setLocation("Unable to fetch location")
      );
    } else {
      setLocation("Geolocation not supported");
    }
  }, []);

  const analyzeCurrentLocation = async (lat, lon) => {
    setLocationLoading(true);
    try {
      // Get current time info
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = getTimeOfDay(hour);
      
      // Call AI location analysis
      const response = await api.post("/ai/analyze-location", {
        coordinates: { latitude: lat, longitude: lon },
        accuracy: 10,
        timestamp: now.toISOString(),
        userId: user?._id || "current-user",
        hour: hour,
        day_of_week: now.getDay(),
        time_of_day: timeOfDay,
      });

      const analysisData = response.data;
      setSafetyAnalysis(analysisData);

      // 🔹 STORE ANALYSIS IN DATABASE
      await storeAnalysisInDatabase(lat, lon, analysisData, "location_analysis");

    } catch (error) {
      console.error("Location analysis failed:", error);
      // Fallback analysis
      const fallbackAnalysis = {
        safety_score: 6,
        risk_level: "Moderate Risk",
        risk_factors: ["Analysis unavailable"],
        recommendations: ["Stay alert", "Use well-lit areas"],
        area_type: "unknown",
        address_info: {
          formatted_address: `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          components: { city: "Your City" }
        }
      };
      
      setSafetyAnalysis(fallbackAnalysis);
      
      // Store fallback analysis too
      await storeAnalysisInDatabase(lat, lon, fallbackAnalysis, "fallback_analysis");
      
    } finally {
      setLocationLoading(false);
    }
  };

  const getTimeOfDay = (hour) => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  };

  // 🔹 NEW: Store Analysis in Database
  const storeAnalysisInDatabase = async (lat, lon, analysisData, analysisType = "crime_analysis") => {
    try {
      if (!user?._id) {
        console.log("⚠️ No user ID available for database storage");
        return;
      }

      const now = new Date();
      
      // Prepare comprehensive data for database storage
      const crimeAnalysisData = {
        userId: user._id,
        location: {
          coordinates: {
            latitude: lat,
            longitude: lon
          },
          address: {
            formatted: analysisData.address_info?.formatted_address || `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            city: analysisData.address_info?.components?.city || "Unknown City",
            area: analysisData.address_info?.components?.neighbourhood || "Unknown Area",
            state: analysisData.address_info?.components?.state || "Unknown State",
            country: analysisData.address_info?.components?.country || "Unknown Country"
          },
          areaType: analysisData.area_type || "unknown"
        },
        riskAssessment: {
          riskScore: analysisData.safety_score || 6,
          riskLevel: analysisData.risk_level || "Moderate Risk",
          safetyIndex: analysisData.safety_score || 6,
          confidence: analysisData.confidence_score || 0.7
        },
        crimeData: {
          totalCrimesFound: 0,
          crimeRate: "Unknown",
          mostCommonCrime: "Unknown",
          recentIncidents: 0,
          isHotspot: false,
          crimeDensity: 0,
          crimeBreakdown: {}
        },
        contextualFactors: {
          timeOfDay: getTimeOfDay(now.getHours()),
          weather: analysisData.weather || { condition: "unknown", temperature: null },
          userProfile: "analysis_user",
          hour: now.getHours(),
          dayOfWeek: now.getDay(),
          analysisType: analysisType
        },
        riskFactors: analysisData.risk_factors || [],
        recommendations: analysisData.recommendations || [],
        dataSources: ["ai_location_analysis", "crime_analysis_page"],
        dataQuality: {
          csvDataUsed: false,
          csvRecordsFound: 0,
          realDataConfidence: analysisData.confidence_score || 0.7,
          analysisMethod: "AI_Location_Analysis"
        },
        deviceInfo: {
          userAgent: navigator.userAgent || "Unknown",
          platform: "Web_CrimeAnalysis_Page",
          analysisSource: "CrimeAnalysis.jsx"
        }
      };

      // Store in database using the crime analysis endpoint
      const response = await api.post("/crime-analysis/store-test", crimeAnalysisData);
      
      if (response.data.success) {
        console.log("✅ Crime analysis stored in database:", response.data.analysisId);
        console.log("🔄 Is update:", response.data.isUpdate);
      } else {
        console.error("❌ Failed to store crime analysis:", response.data);
      }

    } catch (error) {
      console.error("❌ Database storage error:", error);
      console.error("❌ Error details:", error.response?.data);
    }
  };

  // 🔹 Store tab analysis when user views different sections
  const storeTabAnalysis = async (tabName) => {
    try {
      if (!user?._id || !currentLocationData) return;

      const analysisData = {
        tab_viewed: tabName,
        safety_score: safetyAnalysis?.safety_score || 6,
        risk_level: safetyAnalysis?.risk_level || "Moderate Risk",
        risk_factors: [`Viewed ${tabName} analysis`],
        recommendations: [`User analyzed ${tabName} data for safety insights`],
        area_type: safetyAnalysis?.area_type || "unknown",
        address_info: safetyAnalysis?.address_info || {
          formatted_address: `Analysis Location: ${currentLocationData.lat.toFixed(4)}, ${currentLocationData.lon.toFixed(4)}`,
          components: { city: "Analysis City" }
        },
        confidence_score: 0.8
      };

      await storeAnalysisInDatabase(
        currentLocationData.lat, 
        currentLocationData.lon, 
        analysisData, 
        `tab_analysis_${tabName}`
      );

      console.log(`✅ ${tabName} tab analysis stored in database`);
    } catch (error) {
      console.error(`❌ Failed to store ${tabName} analysis:`, error);
    }
  };

  // Enhanced tab change handler
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    
    // Store analysis for this tab view
    storeTabAnalysis(tabName);
  };

  const getSafetyColor = (score) => {
    if (score >= 8) return "#22c55e"; // Green
    if (score >= 6) return "#f59e0b"; // Yellow
    if (score >= 4) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel?.includes("Low")) return "#22c55e";
    if (riskLevel?.includes("Moderate")) return "#f59e0b";
    if (riskLevel?.includes("High")) return "#ef4444";
    return "#6b7280";
  };

  return (
    <div className="crime-container">
      <motion.div
        className="crime-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <button className="back-btn" onClick={() => window.location.href = '/user-dashboard'}>
          ← Back to Dashboard
        </button>
        <h1>🔮 CyberSathi AI Crime Analysis & Prediction</h1>
        <p>
          AI-powered crime insights and real-time risk assessment based on location and time. Stay informed, stay safe. 💜
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => handleTabChange("analysis")}
        >
          📊 City Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === "predictor" ? "active" : ""}`}
          onClick={() => handleTabChange("predictor")}
        >
          🎯 Risk Predictor
        </button>
        <button
          className={`tab-btn ${activeTab === "trends" ? "active" : ""}`}
          onClick={() => handleTabChange("trends")}
        >
          📈 Time Trends
        </button>
      </div>

      {activeTab === "analysis" && (
        <>
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <h2>📊 Crime Rate by City</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="crimeRate" fill="#9333ea" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            <h2>🛡️ Safety Index Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="safetyIndex" stroke="#7e22ce" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1 }}
          >
            <h2>🎯 Crime Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={crimeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {crimeTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="insight-box"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <h3>🧠 AI Insight:</h3>
            <p>
              Based on current data analysis, <b>Pune</b> and <b>Chennai</b> are among the safest cities with
              a high safety index above 70%. <b>Delhi</b> shows higher crime intensity — extra caution is advised.
              The most common crime types are <b>Theft (35%)</b> and <b>Assault (25%)</b>.
            </p>
          </motion.div>
        </>
      )}

      {activeTab === "trends" && (
        <>
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <h2>⏰ Crime Rate by Time of Day</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeBasedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="crimeRate" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            <h2>🛡️ Safety Score by Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeBasedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="safetyScore" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="insight-box"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <h3>⏰ Time-Based Safety Insights:</h3>
            <p>
              Crime rates are highest during <b>late night hours (12 AM - 6 AM)</b> with peak at 3 AM.
              The safest times are <b>morning (9 AM - 12 PM)</b> and <b>early afternoon (12 PM - 3 PM)</b>.
              Evening hours (6 PM - 9 PM) show moderate risk levels.
            </p>
          </motion.div>
        </>
      )}

      {activeTab === "predictor" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <CrimePredictor 
            initialLocation={location} 
            currentLocationData={currentLocationData}
            safetyAnalysis={safetyAnalysis}
            user={user} // Pass user data to CrimePredictor
          />
        </motion.div>
      )}
    </div>
  );
};

export default CrimeAnalysis;
