import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Cloud,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Navigation,
  RefreshCw,
  Zap,
  Eye,
  TrendingUp,
  Smartphone,
  WifiOff,
  Map,
} from "lucide-react";
import api from "../api/apiclient.js";
import "../styles/CrimePredictor.css";

const CrimePredictor = ({ initialLocation, currentLocationData, safetyAnalysis }) => {
  const [formData, setFormData] = useState({
    location: initialLocation || "",
    time_of_day: "",
    weather: "",
    user_profile: "",
    lat: currentLocationData?.lat || null,
    lon: currentLocationData?.lon || null,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [locationStatus, setLocationStatus] = useState("detecting");

  // ---------------------------
  // 🔥 AUTO-DETECT EVERYTHING
  // ---------------------------
  useEffect(() => {
    // Use passed data if available, otherwise detect
    if (currentLocationData && safetyAnalysis) {
      setFormData(prev => ({
        ...prev,
        lat: currentLocationData.lat,
        lon: currentLocationData.lon,
        location: safetyAnalysis.address_info?.formatted_address || 
                 safetyAnalysis.address_info?.components?.city || 
                 initialLocation || 
                 `${currentLocationData.lat.toFixed(4)}, ${currentLocationData.lon.toFixed(4)}`
      }));
      
      // Set weather from analysis if available
      if (safetyAnalysis.weather?.condition) {
        setFormData(prev => ({
          ...prev,
          weather: safetyAnalysis.weather.condition,
          temperature: safetyAnalysis.weather.temperature
        }));
      }
      
      setLocationStatus("success");
      setDetecting(false);
      autoDetectTimeOfDay();
      setLastUpdated(new Date().toLocaleTimeString());
    } else {
      // 🔹 NEW: Check location permission first
      checkLocationPermission().then(() => {
        detectAllData();
      });
    }
  }, [currentLocationData, safetyAnalysis, initialLocation]);

  // 🔹 NEW: Check location permission status
  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('📍 Location permission status:', permission.state);
        
        if (permission.state === 'denied') {
          setError("Location permission is denied. Please enable location access in your browser settings to use automatic detection, or use manual entry.");
          setLocationStatus("failed");
          return false;
        }
        
        return true;
      } catch (err) {
        console.warn('Permission API not supported:', err);
        return true; // Assume permission is available
      }
    }
    return true;
  };

  const detectAllData = async () => {
    setDetecting(true);
    setLocationStatus("detecting");
    setError(""); // Clear previous errors
    
    try {
      await getLiveLocation();
      autoDetectTimeOfDay();
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Detection failed:", err);
      
      // 🔹 NEW: Provide specific error messages and solutions
      if (err.code === 3) { // TIMEOUT
        setError("Location detection timed out. This might be due to poor GPS signal or network issues. Try moving to an open area or use manual entry.");
      } else if (err.code === 1) { // PERMISSION_DENIED
        setError("Location permission denied. Please enable location access in your browser settings and refresh the page.");
      } else {
        setError("Failed to detect location data. You can still use the predictor by entering your location manually.");
      }
      
      // Don't completely fail - allow manual entry
      setLocationStatus("failed");
    } finally {
      setDetecting(false);
    }
  };

  // DETECT TIME OF DAY
  const autoDetectTimeOfDay = () => {
    const hour = new Date().getHours();
    let timeOfDay = "";

    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    setFormData((prev) => ({ ...prev, time_of_day: timeOfDay }));
  };

  // ---------------- ENHANCED LIVE LOCATION DETECTION ----------------
  const getLiveLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("📍 Location access not supported by your browser.");
        setError(error.message);
        setLocationStatus("failed");
        reject(error);
        return;
      }

      setLocationStatus("detecting");

      // 🔹 IMPROVED: Multiple attempts with different configurations
      const attemptLocation = (options, attemptNumber = 1) => {
        console.log(`📍 Location attempt ${attemptNumber} with options:`, options);
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            console.log("📍 Real device coordinates:", lat, lon);
            setFormData((prev) => ({ ...prev, lat, lon }));

            try {
              // Use enhanced location detection with better error handling
              await getLocationNameFromCoordinates(lat, lon);
              await fetchWeather(lat, lon);
              setLocationStatus("success");
              resolve();
            } catch (err) {
              console.error("Location processing failed:", err);
              setLocationStatus("partial");
              resolve(); // Still resolve as we have coordinates
            }
          },
          (err) => {
            console.error(`Location error (attempt ${attemptNumber}):`, err);
            
            // 🔹 NEW: Try with different settings if first attempt fails
            if (attemptNumber === 1 && err.code === 3) { // TIMEOUT
              console.log("🔄 Retrying with relaxed settings...");
              attemptLocation({
                enableHighAccuracy: false, // Less accurate but faster
                timeout: 10000, // Shorter timeout
                maximumAge: 60000 // Allow cached location up to 1 minute
              }, 2);
            } else if (attemptNumber === 2 && err.code === 3) { // Still timeout
              console.log("🔄 Final attempt with minimal settings...");
              attemptLocation({
                enableHighAccuracy: false,
                timeout: 5000, // Very short timeout
                maximumAge: 300000 // Allow cached location up to 5 minutes
              }, 3);
            } else {
              // All attempts failed or different error
              handleLocationError(err);
              reject(err);
            }
          },
          options
        );
      };

      // Start with optimal settings
      attemptLocation({
        enableHighAccuracy: true,
        timeout: 8000, // Reduced from 15000 to 8000
        maximumAge: 30000
      });
    });
  };

  // ENHANCED LOCATION DETECTION WITH MULTIPLE FALLBACKS
  const getLocationNameFromCoordinates = async (lat, lon) => {
    const fallbacks = [
      tryBigDataCloud, // Most reliable free service
      tryLocationIQ,   // Good free alternative
      tryOpenStreetMap, // Basic fallback
    ];

    for (const fallback of fallbacks) {
      try {
        console.log(`Trying ${fallback.name}...`);
        const locationName = await fallback(lat, lon);
        if (locationName && locationName !== "Unknown Location") {
          console.log(`✅ Success with ${fallback.name}:`, locationName);
          setFormData((prev) => ({ ...prev, location: locationName }));
          return locationName;
        }
      } catch (err) {
        console.warn(`❌ ${fallback.name} failed:`, err.message);
        continue;
      }
    }

    // Final fallback - use coordinates
    const fallbackName = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    setFormData((prev) => ({ ...prev, location: fallbackName }));
    setLocationStatus("partial");
    return fallbackName;
  };

  // METHOD 1: BigDataCloud (Most reliable free service)
  const tryBigDataCloud = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data && data.locality) {
        const parts = [];
        if (data.city) parts.push(data.city);
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
        if (data.countryName) parts.push(data.countryName);
        
        return parts.length > 0 ? parts.join(", ") : data.locality;
      }
      
      throw new Error("No location data received");
    } catch (err) {
      throw new Error(`BigDataCloud: ${err.message}`);
    }
  };

  // METHOD 2: LocationIQ (Free tier available)
  const tryLocationIQ = async (lat, lon) => {
    try {
      // Using a free public token (replace with your own from locationiq.com)
      const API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || 'pk.0eef70a07e0c5ac8e0b143076c7e8b0b';
      
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=${API_KEY}&lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        // Build location name from available address components
        const parts = [];
        if (address.neighbourhood) parts.push(address.neighbourhood);
        if (address.suburb) parts.push(address.suburb);
        if (address.city) parts.push(address.city);
        if (address.town) parts.push(address.town);
        if (address.county) parts.push(address.county);
        
        return parts.length > 0 ? parts.join(", ") : data.display_name;
      }
      
      throw new Error("No address data");
    } catch (err) {
      throw new Error(`LocationIQ: ${err.message}`);
    }
  };

  // METHOD 3: OpenStreetMap with better error handling
  const tryOpenStreetMap = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'User-Agent': 'CyberSathi-Women-Safety-App/1.0'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const parts = [];
        
        // Try to get specific location names
        if (address.road) parts.push(address.road);
        if (address.suburb) parts.push(address.suburb);
        if (address.city) parts.push(address.city);
        if (address.town) parts.push(address.town);
        if (address.village) parts.push(address.village);
        
        if (parts.length > 0) {
          return parts.join(", ");
        }
        
        return data.display_name || "Unknown Location";
      }
      
      throw new Error("No address data");
    } catch (err) {
      throw new Error(`OpenStreetMap: ${err.message}`);
    }
  };

  // Handle location errors with better user feedback
  const handleLocationError = (error) => {
    let errorMessage = "📍 ";
    let actionMessage = "";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage += "Location access denied.";
        actionMessage = "Please enable location permissions in your browser settings and refresh the page.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage += "Location unavailable.";
        actionMessage = "Please check your device location settings and internet connection.";
        break;
      case error.TIMEOUT:
        errorMessage += "Location detection timed out.";
        actionMessage = "This might be due to poor GPS signal. Try moving to an open area or use manual entry.";
        break;
      default:
        errorMessage += "Unable to detect your location.";
        actionMessage = "Please try again or enter your location manually.";
        break;
    }

    setError(`${errorMessage} ${actionMessage}`);
    setLocationStatus("failed");
    
    // 🔹 NEW: Provide fallback options
    setFormData((prev) => ({ 
      ...prev, 
      location: "Location Detection Failed - Click 'Enter Manually' to proceed",
      lat: null,
      lon: null,
      weather: "unknown"
    }));

    // 🔹 NEW: Auto-suggest manual entry after timeout
    if (error.code === 3) { // TIMEOUT
      setTimeout(() => {
        if (confirm("Location detection is taking too long. Would you like to enter your location manually?")) {
          handleManualLocation();
        }
      }, 2000);
    }
  };

  // ---------------- WEATHER API WITH BETTER ERROR HANDLING ---------------
  const fetchWeather = async (lat, lon) => {
    if (!lat || !lon) {
      setFormData((prev) => ({ 
        ...prev, 
        weather: "unknown",
        temperature: null
      }));
      return;
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,temperature_2m&timezone=auto`
      );

      if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);
      
      const data = await response.json();
      
      if (data.current) {
        const weatherCode = data.current.weather_code;
        const temperature = data.current.temperature_2m;
        const weather = getWeatherFromCode(weatherCode);
        
        setFormData((prev) => ({
          ...prev,
          weather,
          temperature: temperature ? Math.round(temperature) : null
        }));
      } else {
        throw new Error("No weather data received");
      }
    } catch (err) {
      console.warn("Weather fetch failed:", err.message);
      setFormData((prev) => ({ 
        ...prev, 
        weather: "unknown",
        temperature: null
      }));
    }
  };

  const getWeatherFromCode = (code) => {
    const weatherMap = {
      0: "clear", 1: "clear", 2: "clear", 3: "cloudy",
      45: "fog", 48: "fog",
      51: "drizzle", 53: "drizzle", 55: "drizzle",
      61: "rain", 63: "rain", 65: "rain",
      80: "rain", 81: "rain", 82: "rain",
      95: "storm", 96: "storm", 99: "storm"
    };
    return weatherMap[code] || "clear";
  };

  const getWeatherIcon = (weather) => {
    const icons = {
      clear: "☀️",
      cloudy: "⛅",
      fog: "🌫️",
      drizzle: "🌦️",
      rain: "🌧️",
      storm: "⛈️",
      unknown: "❓"
    };
    return icons[weather] || "🌤️";
  };

  const getTimeIcon = (time) => {
    const icons = {
      morning: "🌅",
      afternoon: "☀️",
      evening: "🌇",
      night: "🌙"
    };
    return icons[time] || "🕒";
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case "detecting":
        return <RefreshCw size={16} className="spinning" />;
      case "success":
        return <CheckCircle size={16} color="#10b981" />;
      case "partial":
        return <Map size={16} color="#f59e0b" />;
      case "failed":
        return <WifiOff size={16} color="#ef4444" />;
      default:
        return <MapPin size={16} />;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case "detecting":
        return "Detecting your precise location...";
      case "success":
        return "Precise location detected successfully";
      case "partial":
        return "Approximate location detected (limited accuracy)";
      case "failed":
        return "Location detection failed - manual entry required";
      default:
        return "Checking location services...";
    }
  };

  // ------------ PREDICTION WITH BETTER ERROR HANDLING ------------
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Enhanced validation
    if (!formData.user_profile) {
      setError("Please select your current situation for accurate safety assessment");
      return;
    }

    if (!formData.lat || !formData.lon) {
      // 🔹 NEW: More helpful error message
      if (locationStatus === "failed") {
        setError("Location is required for safety prediction. Please click 'Enter Manually' to provide your location, or enable location services and try 'Refresh' again.");
      } else {
        setError("Location data is required for safety prediction. Please wait for location detection to complete or enter manually.");
      }
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Prepare data for API
      const predictionData = {
        ...formData,
        timestamp: new Date().toISOString(),
        userId: JSON.parse(localStorage.getItem("user"))?.id || JSON.parse(localStorage.getItem("user"))?._id,
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform
        }
      };

      console.log("Sending prediction data:", predictionData);

      const response = await api.post("/ai/predict-crime", predictionData);
      
      if (response.data && response.data.risk) {
        setResult(response.data);

        // Store in localStorage for other components
        const formatted = `${response.data.risk.toUpperCase()} (${response.data.score}/10)`;
        localStorage.setItem("predictedRisk", formatted);

        // 🔹 NEW: Show database storage status
        if (response.data.database_stored) {
          console.log("✅ Analysis stored in database successfully");
        } else if (response.data.database_error) {
          console.warn("⚠️ Database storage failed:", response.data.database_error);
        }

        // Notify family if risk is high (only if user has family contacts)
        if (response.data.risk === "high") {
          try {
            await api.post("/sos/notify-family", {
              userName: JSON.parse(localStorage.getItem("user"))?.name || "User",
              risk: response.data.risk,
              score: response.data.score,
              location: formData.location,
              coords: { lat: formData.lat, lon: formData.lon },
              time: new Date().toISOString(),
              message: `High risk alert! Safety score: ${response.data.score}/10 at ${formData.location}`
            });
          } catch (notificationError) {
            console.warn("Family notification failed:", notificationError);
            // Don't show this error to user as it doesn't affect the main prediction
          }
        }
      } else {
        throw new Error("Invalid response from prediction service");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      
      if (err.response) {
        // Server responded with error status
        setError(`Prediction service error: ${err.response.data?.message || 'Please try again later.'}`);
      } else if (err.request) {
        // Network error
        setError("Network connection failed. Please check your internet and try again.");
      } else {
        // Other errors
        setError("Prediction service unavailable. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh data with better UX
  const handleRefresh = async () => {
    setDetecting(true);
    setLocationStatus("detecting");
    setError("");
    setResult(null);
    
    try {
      await detectAllData();
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  // Manual location input (fallback) - ENHANCED
  const handleManualLocation = async () => {
    const manualLocation = prompt(
      "Please enter your current location:\n\n" +
      "Examples:\n" +
      "• City name (e.g., 'Mumbai')\n" +
      "• Area name (e.g., 'Andheri West, Mumbai')\n" +
      "• Landmark (e.g., 'Near Gateway of India')"
    );
    
    if (manualLocation && manualLocation.trim()) {
      const location = manualLocation.trim();
      
      // Try to geocode the manual location to get coordinates
      try {
        setLocationStatus("detecting");
        const coords = await geocodeLocation(location);
        
        if (coords) {
          setFormData(prev => ({ 
            ...prev, 
            location: location,
            lat: coords.lat,
            lon: coords.lon
          }));
          
          // Try to get weather for the geocoded location
          await fetchWeather(coords.lat, coords.lon);
          setLocationStatus("manual");
        } else {
          throw new Error("Geocoding failed");
        }
      } catch (err) {
        console.warn("Manual location geocoding failed:", err);
        
        // Use approximate coordinates for major cities as fallback
        const cityCoords = getCityCoordinates(location);
        
        setFormData(prev => ({ 
          ...prev, 
          location: location,
          lat: cityCoords.lat,
          lon: cityCoords.lon,
          weather: "unknown"
        }));
        setLocationStatus("manual");
      }
      
      setError(""); // Clear any previous errors
    }
  };

  // 🔹 NEW: Geocode manual location input
  const geocodeLocation = async (locationName) => {
    try {
      // Try OpenStreetMap Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CyberSathi-Women-Safety-App/1.0'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      
      throw new Error("No results found");
    } catch (err) {
      console.warn("Geocoding failed:", err);
      return null;
    }
  };

  // 🔹 NEW: Fallback coordinates for major Indian cities
  const getCityCoordinates = (locationName) => {
    const cityMap = {
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'delhi': { lat: 28.7041, lon: 77.1025 },
      'bangalore': { lat: 12.9716, lon: 77.5946 },
      'bengaluru': { lat: 12.9716, lon: 77.5946 },
      'hyderabad': { lat: 17.3850, lon: 78.4867 },
      'chennai': { lat: 13.0827, lon: 80.2707 },
      'kolkata': { lat: 22.5726, lon: 88.3639 },
      'pune': { lat: 18.5204, lon: 73.8567 },
      'ahmedabad': { lat: 23.0225, lon: 72.5714 },
      'jaipur': { lat: 26.9124, lon: 75.7873 },
      'lucknow': { lat: 26.8467, lon: 80.9462 },
      'kanpur': { lat: 26.4499, lon: 80.3319 },
      'nagpur': { lat: 21.1458, lon: 79.0882 },
      'indore': { lat: 22.7196, lon: 75.8577 },
      'thane': { lat: 19.2183, lon: 72.9781 },
      'bhopal': { lat: 23.2599, lon: 77.4126 },
      'visakhapatnam': { lat: 17.6868, lon: 83.2185 },
      'pimpri': { lat: 18.6298, lon: 73.7997 },
      'patna': { lat: 25.5941, lon: 85.1376 },
      'vadodara': { lat: 22.3072, lon: 73.1812 }
    };

    const searchKey = locationName.toLowerCase();
    
    // Check for exact city match
    for (const [city, coords] of Object.entries(cityMap)) {
      if (searchKey.includes(city)) {
        return coords;
      }
    }
    
    // Default to Mumbai if no match found
    return { lat: 19.0760, lon: 72.8777 };
  };

  // Get Risk Icon and Color
  const getRiskData = (risk) => {
    switch (risk) {
      case "high":
        return {
          icon: <XCircle size={28} />,
          color: "#ef4444",
          bgColor: "#fef2f2",
          borderColor: "#fecaca",
          label: "HIGH RISK"
        };
      case "moderate":
        return {
          icon: <AlertTriangle size={28} />,
          color: "#f59e0b",
          bgColor: "#fffbeb",
          borderColor: "#fed7aa",
          label: "MODERATE RISK"
        };
      case "low":
        return {
          icon: <CheckCircle size={28} />,
          color: "#10b981",
          bgColor: "#f0fdf4",
          borderColor: "#bbf7d0",
          label: "LOW RISK"
        };
      default:
        return {
          icon: <Shield size={28} />,
          color: "#6b7280",
          bgColor: "#f9fafb",
          borderColor: "#e5e7eb",
          label: "UNKNOWN RISK"
        };
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Check if prediction can be submitted
  const canSubmit = !loading && 
                   !detecting && 
                   formData.user_profile && 
                   formData.lat && 
                   formData.lon && 
                   locationStatus !== "failed";

  return (
    <motion.div
      className="crime-predictor"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div className="predictor-header" variants={itemVariants}>
        <div className="header-icon">
          <Shield size={32} />
        </div>
        <h1>AI Safety Predictor</h1>
        <p>Real-time risk assessment based on your current situation and environment</p>
      </motion.div>

      {/* Auto Detection Status */}
      <motion.div className="detection-status" variants={itemVariants}>
        <div className="status-content">
          {detecting ? (
            <>
              <RefreshCw size={20} className="spinning" />
              <span>Detecting your location and environment...</span>
            </>
          ) : (
            <>
              <CheckCircle size={20} color="#10b981" />
              <span>Live data ready • Updated {lastUpdated}</span>
            </>
          )}
        </div>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={detecting}
          title="Refresh location data"
        >
          <RefreshCw size={16} />
        </button>
      </motion.div>

      {/* Location Status */}
      <motion.div className="location-status" variants={itemVariants}>
        <div className="location-status-content">
          {getLocationStatusIcon()}
          <span>{getLocationStatusText()}</span>
        </div>
        {(locationStatus === "failed" || locationStatus === "partial") && (
          <button 
            className="manual-location-btn"
            onClick={handleManualLocation}
          >
            <MapPin size={16} />
            Enter Manually
          </button>
        )}
      </motion.div>

      {/* Auto Detected Info Cards */}
      <motion.div className="auto-info-grid" variants={itemVariants}>
        <div className="info-card location">
          <div className="card-icon">
            <MapPin size={20} />
          </div>
          <div className="card-content">
            <h4>Location</h4>
            <p>{formData.location || "Detecting..."}</p>
            {formData.lat && formData.lon && (
              <small className="coordinates">
                {formData.lat.toFixed(4)}, {formData.lon.toFixed(4)}
              </small>
            )}
          </div>
        </div>

        <div className="info-card weather">
          <div className="card-icon">
            <Cloud size={20} />
          </div>
          <div className="card-content">
            <h4>Weather</h4>
            <p>
              {getWeatherIcon(formData.weather)} 
              {formData.weather ? ` ${formData.weather.replace('_', ' ').toUpperCase()}` : " Detecting..."}
            </p>
            {formData.temperature && (
              <small className="temperature">
                {formData.temperature}°C
              </small>
            )}
          </div>
        </div>

        <div className="info-card time">
          <div className="card-icon">
            <Clock size={20} />
          </div>
          <div className="card-content">
            <h4>Time of Day</h4>
            <p>
              {getTimeIcon(formData.time_of_day)}
              {formData.time_of_day ? ` ${formData.time_of_day.toUpperCase()}` : " Detecting..."}
            </p>
            <small className="current-time">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        </div>
      </motion.div>

      {/* Prediction Form */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="predictor-form"
        variants={itemVariants}
      >
        <div className="form-section">
          <div className="section-header">
            <User size={20} />
            <h3>Your Current Situation</h3>
          </div>
          <p className="section-description">
            Select how you're currently positioned for accurate risk assessment
          </p>
          
          <div className="profile-options">
            {[
              { 
                value: "alone", 
                label: "Alone", 
                icon: "🚶", 
                description: "Walking or traveling by yourself" 
              },
              { 
                value: "with_friends", 
                label: "With Friends", 
                icon: "👥", 
                description: "In a group with trusted people" 
              },
              { 
                value: "family", 
                label: "With Family", 
                icon: "👨‍👩‍👧", 
                description: "With family members" 
              },
              { 
                value: "public_transport", 
                label: "Public Transport", 
                icon: "🚌", 
                description: "Using bus, train, or metro" 
              },
              { 
                value: "vehicle", 
                label: "In Vehicle", 
                icon: "🚗", 
                description: "Traveling in personal or taxi" 
              },
              { 
                value: "indoor_public", 
                label: "Indoor Public", 
                icon: "🏬", 
                description: "In mall, restaurant, or building" 
              }
            ].map((option) => (
              <label key={option.value} className="profile-option">
                <input
                  type="radio"
                  name="user_profile"
                  value={option.value}
                  checked={formData.user_profile === option.value}
                  onChange={(e) => {
                    setFormData({ ...formData, user_profile: e.target.value });
                    setError(""); // Clear error when user selects an option
                  }}
                />
                <div className="option-content">
                  <span className="option-icon">{option.icon}</span>
                  <div className="option-text">
                    <span className="option-label">{option.label}</span>
                    <span className="option-description">{option.description}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <motion.button 
          type="submit" 
          className={`predict-btn ${!canSubmit ? 'disabled' : ''}`}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="spinning" />
              Analyzing Safety Risk...
            </>
          ) : !formData.user_profile ? (
            <>
              <User size={20} />
              Select Your Situation
            </>
          ) : locationStatus === "failed" ? (
            <>
              <WifiOff size={20} />
              Location Required
            </>
          ) : (
            <>
              <Zap size={20} />
              Predict Safety Risk
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button 
              className="error-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="result-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div 
              className="risk-header"
              style={{ 
                backgroundColor: getRiskData(result.risk).bgColor,
                borderColor: getRiskData(result.risk).borderColor
              }}
            >
              <div className="risk-icon">
                {getRiskData(result.risk).icon}
              </div>
              <div className="risk-info">
                <h3 style={{ color: getRiskData(result.risk).color }}>
                  {getRiskData(result.risk).label}
                </h3>
                <p>Safety Assessment Result</p>
              </div>
              <div className="risk-score">
                <span>{result.score}/10</span>
                <small>Safety Score</small>
              </div>
            </div>

            {/* Real Crime Data Insights */}
            {result.real_crime_analysis && (
              <div className="real-crime-insights">
                <div className="section-title">
                  <AlertTriangle size={20} />
                  <h4>🚨 Real Crime Data Analysis</h4>
                </div>
                <div className="crime-stats-grid">
                  <div className="crime-stat">
                    <span className="stat-label">Area Crime Rate:</span>
                    <span className={`stat-value ${result.real_crime_analysis.area_crime_rate.toLowerCase().replace(' ', '-')}`}>
                      {result.real_crime_analysis.area_crime_rate}
                    </span>
                  </div>
                  
                  {result.real_crime_analysis.crime_data_found > 0 && (
                    <div className="crime-stat">
                      <span className="stat-label">Incidents Found:</span>
                      <span className="stat-value">
                        {result.real_crime_analysis.crime_data_found} in area
                      </span>
                    </div>
                  )}
                  
                  {result.real_crime_analysis.most_common_crime !== 'Unknown' && result.real_crime_analysis.most_common_crime !== 'None' && (
                    <div className="crime-stat">
                      <span className="stat-label">Common Crime:</span>
                      <span className="stat-value crime-type">
                        {result.real_crime_analysis.most_common_crime}
                      </span>
                    </div>
                  )}
                  
                  {result.real_crime_analysis.recent_incidents > 0 && (
                    <div className="crime-stat">
                      <span className="stat-label">Recent Incidents:</span>
                      <span className="stat-value recent-incidents">
                        {result.real_crime_analysis.recent_incidents} this month
                      </span>
                    </div>
                  )}
                  
                  {result.real_crime_analysis.is_hotspot && (
                    <div className="crime-stat hotspot-warning">
                      <span className="stat-label">⚠️ Crime Hotspot:</span>
                      <span className="stat-value hotspot">
                        High Activity Area
                      </span>
                    </div>
                  )}
                  
                  <div className="crime-stat">
                    <span className="stat-label">Safety Index:</span>
                    <span className={`stat-value safety-index-${Math.floor(result.real_crime_analysis.safety_index)}`}>
                      {result.real_crime_analysis.safety_index}/10
                    </span>
                  </div>
                </div>
                
                <div className="data-confidence">
                  <small>
                    📊 Data Confidence: {Math.round(result.real_crime_analysis.data_confidence * 100)}%
                    {result.real_crime_analysis.crime_data_found === 0 && " (Using simulated data for demonstration)"}
                  </small>
                </div>
              </div>
            )}

            <div className="recommendations">
              <div className="section-title">
                <Eye size={20} />
                <h4>Safety Recommendations</h4>
              </div>
              <div className="recommendations-list">
                {(result.recommendations || [
                  "Stay in well-lit areas",
                  "Keep your phone accessible",
                  "Share your location with trusted contacts",
                  "Be aware of your surroundings"
                ]).map((rec, index) => (
                  <motion.div
                    key={index}
                    className="recommendation-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="recommendation-bullet"></div>
                    <span>{rec}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            {result.risk_factors && result.risk_factors.length > 0 && (
              <div className="risk-factors-section">
                <div className="section-title">
                  <AlertTriangle size={16} />
                  <h5>Risk Factors Identified</h5>
                </div>
                <div className="risk-factors-list">
                  {result.risk_factors.map((factor, index) => (
                    <span key={index} className="risk-factor-tag">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="result-footer">
              <TrendingUp size={16} />
              <span>
                Risk assessment based on real crime data & current conditions
                {result.real_crime_analysis && ` • ${Math.round(result.confidence * 100)}% confidence`}
              </span>
              <button 
                className="new-assessment-btn"
                onClick={() => setResult(null)}
              >
                New Assessment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety Tips */}
      {!result && (
        <motion.div className="safety-tips" variants={itemVariants}>
          <div className="tips-header">
            <Smartphone size={20} />
            <h3>Quick Safety Tips</h3>
          </div>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📱</div>
              <p>Keep your phone charged and accessible</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🎒</div>
              <p>Stay in well-lit, populated areas</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">👥</div>
              <p>Share your location with trusted contacts</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🚨</div>
              <p>Know emergency contacts in your area</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CrimePredictor;