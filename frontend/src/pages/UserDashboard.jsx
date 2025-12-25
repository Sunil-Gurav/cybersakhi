import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MapPin,
  Brain,
  Smile,
  ShieldCheck,
  AlertTriangle,
  Bot,
  UserPlus,
  Users,
  Mail,
  Navigation,
  Zap,
  Heart,
  Shield,
  Volume2,
  VolumeX,
  Clock,
  Send,
  Locate,
  Map,
  Compass,
  Satellite,
  Building,
  Navigation2,
  History,
  Activity
} from "lucide-react";
import "../styles/UserDashboard.css";
import api from "../api/apiclient";
import AIAssistant from "../components/AIAssistant";
import TalkingAssistant from "../components/TalkingAssistant";
import AnalysisHistory from "../components/AnalysisHistory";
import { useCustomAlert } from "../components/CustomAlert";

const UserDashboard = () => {
  const { showAlert } = useCustomAlert();
  const navigate = useNavigate();

  const [emotion, setEmotion] = useState("😊 Happy");
  const [crimeRisk, setCrimeRisk] = useState("Analyzing...");
  const [location, setLocation] = useState("Click to get my location");
  const [locationDetails, setLocationDetails] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState("");

  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTalkingAssistant, setShowTalkingAssistant] = useState(false);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const [user, setUser] = useState(null);
  const [listening, setListening] = useState(false);
  const [allowBackgroundListening, setAllowBackgroundListening] =
    useState(false);

  const [familyEmail, setFamilyEmail] = useState("");
  const [familyList, setFamilyList] = useState([]);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // ---------------------------
  // Load User + Family Emails + Time
  // ---------------------------
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    console.log("🔍 UserDashboard - User from localStorage:", u);
    console.log("🔍 UserDashboard - Token exists:", !!token);
    
    if (!u || !token) {
      console.log("⚠️ User or token missing - user might need to log in again");
      showAlert("warning", "Authentication Issue", "Please log in again if you experience issues.");
    }
    
    setUser(u);

    const storedFamily = JSON.parse(localStorage.getItem("familyEmails")) || [];
    setFamilyList(storedFamily);

    // Update time every minute
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // ---------------------------
  // Check Location Permission - FIXED
  // ---------------------------
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!("geolocation" in navigator)) {
        showAlert(
          "error",
          "Not Supported",
          "Your browser doesn't support location services."
        );
        setHasLocationPermission(false);
        return;
      }

      try {
        // Check actual permission status
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          
          if (permission.state === 'granted') {
            setHasLocationPermission(true);
          } else if (permission.state === 'denied') {
            setHasLocationPermission(false);
          } else {
            // Permission is 'prompt' - user hasn't decided yet
            setHasLocationPermission(false);
          }

          // Listen for permission changes
          permission.addEventListener('change', () => {
            setHasLocationPermission(permission.state === 'granted');
          });
        } else {
          // Fallback for browsers that don't support permissions API
          // Try to get location to check permission
          navigator.geolocation.getCurrentPosition(
            () => {
              setHasLocationPermission(true);
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                setHasLocationPermission(false);
              } else {
                setHasLocationPermission(true); // Other errors don't mean no permission
              }
            },
            { timeout: 1000, maximumAge: 600000 }
          );
        }
      } catch (error) {
        console.error("Permission check error:", error);
        setHasLocationPermission(false);
      }
    };

    checkLocationPermission();
  }, []);

  // ---------------------------
  // Battery Level Check
  // ---------------------------
  useEffect(() => {
    if ("getBattery" in navigator || "battery" in navigator) {
      navigator.getBattery().then(function (battery) {
        setBatteryLevel(`${Math.floor(battery.level * 100)}%`);

        battery.addEventListener("levelchange", function () {
          setBatteryLevel(`${Math.floor(battery.level * 100)}%`);
        });
      });
    }
  }, []);

  // ---------------------------
  // Load Emotion from LocalStorage
  // ---------------------------
  useEffect(() => {
    const handleEmotionUpdate = (event) => {
      const { emotion: detectedEmotion } = event.detail;
      const emotionDisplay = getEmotionDisplay(detectedEmotion);

      setEmotion(emotionDisplay);
      localStorage.setItem("currentEmotion", emotionDisplay);
    };

    window.addEventListener("emotionUpdate", handleEmotionUpdate);

    const savedEmotion = localStorage.getItem("currentEmotion");
    if (savedEmotion) setEmotion(savedEmotion);

    return () => {
      window.removeEventListener("emotionUpdate", handleEmotionUpdate);
    };
  }, []);

  // ---------------------------
  // Helper Functions
  // ---------------------------
  const getTimeOfDay = (hour) => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  };

  const getEmotionDisplay = (emotion) => {
    const emotionMap = {
      happy: "😊 Happy",
      sad: "😢 Sad",
      angry: "😠 Angry",
      scared: "😨 Scared",
      distressed: "😰 Distressed",
      neutral: "😐 Neutral",
    };
    return emotionMap[emotion] || "😐 Neutral";
  };

  // ---------------------------
  // Crime Risk Polling
  // ---------------------------
  useEffect(() => {
    const storedRisk = localStorage.getItem("predictedRisk");
    if (storedRisk) setCrimeRisk(storedRisk);

    const interval = setInterval(() => {
      const updatedRisk = localStorage.getItem("predictedRisk");
      if (updatedRisk) {
        setCrimeRisk(updatedRisk);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []); // Remove crimeRisk from dependencies to prevent infinite loop

  // ---------------------------
  // SOS Function
  // ---------------------------
  const handleSOS = async (silent = false) => {
    try {
      if (!navigator.geolocation) {
        if (!silent)
          showAlert("error", "Geolocation Error", "Geolocation not supported.");
        return;
      }

      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          try {
            await api.post("/sos/trigger", {
              userId: user?._id || user?.id,
              message: silent ? "Voice SOS" : "Button SOS",
              coords: { lat, lon },
            });

            if (!silent)
              showAlert(
                "success",
                "SOS Triggered",
                `📍 Location sent: ${lat.toFixed(3)}, ${lon.toFixed(3)}`
              );
          } catch (err) {
            console.error(err);
            if (!silent)
              showAlert("error", "SOS Failed", "Backend error occurred.");
          }
        },
        () => {
          if (!silent)
            showAlert("error", "Location Error", "Permission denied.");
        }
      );
    } catch (err) {
      console.error(err);
      if (!silent)
        showAlert("error", "Unexpected Error", "Something went wrong.");
    }
  };

  // ---------------------------
  // Voice Intent Checker (Silent SOS) - FIXED WITH FALLBACK
  // ---------------------------
  const [recognition, setRecognition] = useState(null);

  // Local SOS keyword detection as fallback
  const checkForSOSKeywords = (text) => {
    const sosKeywords = [
      "help",
      "emergency",
      "sos",
      "save me",
      "danger",
      "help me",
      "rescue",
      "urgent",
      "critical",
      "accident",
      "attack",
      "police",
      "ambulance",
      "fire",
      "hospital",
      "911",
      "call police",
    ];

    const lowerText = text.toLowerCase();
    return sosKeywords.some((keyword) => lowerText.includes(keyword));
  };

  const startActiveVoice = () => {
    if (listening)
      return showAlert("warning", "Already Listening", "Voice mode active!");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition)
      return showAlert("error", "Unsupported", "Browser has no voice API.");

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = async (e) => {
      const text = e.results[e.resultIndex][0].transcript;
      console.log("User said:", text);

      try {
        // Try AI intent detection first
        const res = await api.post("/ai/check-intent", { text });
        if (res.data.intent === "sos") {
          handleSOS(true);
          showAlert(
            "success",
            "Voice SOS Activated",
            "Emergency detected via AI!"
          );
        }
      } catch (e) {
        console.error("AI intent check failed, using local detection:", e);

        // Fallback to local keyword detection
        if (checkForSOSKeywords(text)) {
          handleSOS(true);
          showAlert(
            "success",
            "Voice SOS Activated",
            "Emergency detected via keywords!"
          );
        } else {
          showAlert("info", "Voice Command", `I heard: "${text}"`);
        }
      }
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.start();
    setRecognition(rec);
    setListening(true);
    showAlert("voice", "Voice Mode Activated", "🎤 Listening for commands...");
  };

  const stopActiveVoice = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
      setRecognition(null);
      showAlert("info", "Stopped", "Voice mode turned off.");
    }
  };

  // ---------------------------
  // REAL DEVICE LOCATION TRACKING
  // ---------------------------
  const getRealDeviceLocation = () => {
    if (!navigator.geolocation) {
      showAlert(
        "error",
        "Not Supported",
        "Geolocation is not supported by this browser."
      );
      return;
    }

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setLocationLoading(true);
    setLocation("🛰️ Getting your device location...");

    // Request device location with high accuracy
    navigator.geolocation.getCurrentPosition(
      // Success callback
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          console.log("📍 Device Location Found:", { lat, lon, accuracy });

          // Show coordinates immediately
          const coordinates = `📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          setLocation(coordinates);

          // Send to AI for analysis with real address
          await getAILocationAnalysis(lat, lon, accuracy);
        } catch (error) {
          console.error("Location processing error:", error);
          showAlert(
            "error",
            "Location Error",
            "Failed to process your location."
          );
        } finally {
          setLocationLoading(false);
        }
      },
      // Error callback
      (error) => {
        setLocationLoading(false);
        handleLocationError(error);
      },
      // Options - High accuracy for best results
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const testActualLocation = async () => {
    if (!navigator.geolocation) return;

    // First check permission status
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log("🔍 PERMISSION STATUS:", permission.state);
        console.log("🔍 hasLocationPermission state:", hasLocationPermission);
      } catch (error) {
        console.error("Permission query error:", error);
      }
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log("📍 YOUR ACTUAL COORDINATES:", { lat, lon });

        // Send to debug endpoint
        try {
          const response = await api.post("/ai/debug-location", {
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
          });

          console.log("🔍 DEBUG RESULTS:", response.data);
          showAlert(
            "info",
            "Debug Info",
            `Your coordinates: ${lat}, ${lon}. Check console for details.`
          );
        } catch (error) {
          console.error("Debug error:", error);
        }
      },
      (error) => {
        console.error("Location error:", error);
        console.log("🔍 Error code:", error.code);
        console.log("🔍 Error message:", error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  // ---------------------------
  // AI LOCATION ANALYSIS - SIMPLIFIED (Only Address, No Safety Prediction)
  // ---------------------------
  const getAILocationAnalysis = async (lat, lon, accuracy) => {
    try {
      console.log("🤖 Sending to AI analysis:", { lat, lon });

      const response = await api.post("/ai/analyze-location", {
        coordinates: {
          latitude: lat,
          longitude: lon,
        },
        accuracy: accuracy,
        timestamp: new Date().toISOString(),
        userId: user?._id || "current-user",
      });

      const aiAnalysis = response.data;

      console.log("✅ AI Analysis Received:", aiAnalysis);

      // Update with ONLY ADDRESS INFO - No Safety Prediction
      setLocationDetails({
        coordinates: { lat, lon },
        accuracy: accuracy,

        // Real address from AI
        formattedAddress:
          aiAnalysis.address_info?.formatted_address ||
          aiAnalysis.address?.formatted ||
          `Your Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,

        // REAL LOCATION DETAILS ONLY
        cityName:
          aiAnalysis.address_info?.components?.city ||
          aiAnalysis.address_info?.components?.town ||
          aiAnalysis.address_info?.components?.village ||
          "Your City",

        areaName:
          aiAnalysis.address_info?.components?.neighbourhood ||
          aiAnalysis.address_info?.components?.suburb ||
          aiAnalysis.address_info?.components?.road ||
          "Your Area",

        state: aiAnalysis.address_info?.components?.state || "Your State",
        country: aiAnalysis.address_info?.components?.country || "Your Country",

        // Timestamp only
        timestamp: aiAnalysis.timestamp,
      });

      // 🔹 STORE LOCATION ACTIVITY IN BACKEND (Address Only)
      try {
        await api.post("/activities/store-activity", {
          userId: user?._id,
          activityType: "location_analysis",
          data: {
            coordinates: { latitude: lat, longitude: lon },
            address: {
              formatted:
                aiAnalysis.address_info?.formatted_address ||
                aiAnalysis.address?.formatted,
              city: aiAnalysis.address_info?.components?.city,
              area: aiAnalysis.address_info?.components?.neighbourhood,
              state: aiAnalysis.address_info?.components?.state,
              country: aiAnalysis.address_info?.components?.country,
            },
            batteryLevel: batteryLevel,
          },
        });
        console.log("📍 Location activity stored in backend");
      } catch (storeError) {
        console.error("❌ Failed to store location activity:", storeError);
      }

      // 🔹 STORE LOCATION IN USER DATA FOR FAMILY ACCESS (Address Only)
      try {
        console.log("🔍 Debug - User:", user);
        console.log("🔍 Debug - Token exists:", !!localStorage.getItem("token"));
        
        await api.post("/user-data/location-test", {
          userId: user?._id,
          coordinates: { lat, lon },
          address: {
            formatted: aiAnalysis.address_info?.formatted_address || aiAnalysis.address?.formatted,
            city: aiAnalysis.address_info?.components?.city,
            area: aiAnalysis.address_info?.components?.neighbourhood,
            state: aiAnalysis.address_info?.components?.state,
            country: aiAnalysis.address_info?.components?.country,
            house: aiAnalysis.address_info?.components?.house_number,
            road: aiAnalysis.address_info?.components?.road,
            neighbourhood: aiAnalysis.address_info?.components?.neighbourhood,
            suburb: aiAnalysis.address_info?.components?.suburb,
            postcode: aiAnalysis.address_info?.components?.postcode,
          },
          accuracy: accuracy,
          areaType: "unknown",
        });
        console.log("✅ Location stored in UserData for family access");
      } catch (locationStoreError) {
        console.error("❌ Failed to store location in UserData:", locationStoreError);
      }

      showAlert(
        "success",
        "📍 Location Found!",
        `You're in ${aiAnalysis.address_info?.components?.city || aiAnalysis.address_info?.components?.town || "your current location"}`
      );
    } catch (error) {
      console.error("❌ AI analysis failed:", error);

      // Fallback - Show basic location info
      performBasicLocationAnalysis(lat, lon);
      showAlert(
        "info",
        "Basic Analysis",
        "Showing your device location."
      );
    }
  };

  // ---------------------------
  // BASIC LOCATION ANALYSIS (Fallback) - Address Only
  // ---------------------------
  const performBasicLocationAnalysis = async (lat, lon) => {
    const basicAnalysis = {
      coordinates: { lat, lon },
      formattedAddress: `Your Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      cityName: "Your City",
      areaName: "Current Location",
      state: "Your State",
      country: "Your Country",
    };

    setLocationDetails(basicAnalysis);

    // 🔹 STORE BASIC LOCATION IN USER DATA FOR FAMILY ACCESS (Address Only)
    try {
      console.log("🔍 Debug Basic - User:", user);
      console.log("🔍 Debug Basic - Token exists:", !!localStorage.getItem("token"));
      
      await api.post("/user-data/location-test", {
        userId: user?._id,
        coordinates: { lat, lon },
        address: {
          formatted: `Your Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          city: "Your City",
          area: "Current Location",
          state: "Your State",
          country: "Your Country",
        },
        accuracy: 0,
        areaType: "unknown",
      });
      console.log("✅ Basic location stored in UserData for family access");
    } catch (locationStoreError) {
      console.error("❌ Failed to store basic location in UserData:", locationStoreError);
    }
  };

  // ---------------------------
  // LOCATION ERROR HANDLING - IMPROVED
  // ---------------------------
  const handleLocationError = (error) => {
    let errorMessage = "Location access issue. ";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setHasLocationPermission(false);
        errorMessage +=
          "Please allow location permissions in your browser settings. Click the location icon in the address bar or check browser settings → Privacy → Location.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage +=
          "Your location is currently unavailable. Please check your GPS/location services and try again.";
        break;
      case error.TIMEOUT:
        errorMessage += "Location request timed out. Please try again.";
        break;
      default:
        errorMessage += "An unknown error occurred while getting your location.";
        break;
    }

    setLocation("❌ Location Access Needed");
    showAlert("error", "Location Error", errorMessage);
    setLocationLoading(false);
  };

  // ---------------------------
  // REQUEST LOCATION PERMISSION - IMPROVED
  // ---------------------------
  const requestLocationPermission = async () => {
    if (!("geolocation" in navigator)) {
      showAlert(
        "error",
        "Not Supported",
        "Your browser doesn't support location services."
      );
      return;
    }

    // Check current permission status
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'denied') {
          showAlert(
            "error",
            "Permission Denied",
            "Location access is blocked. Please enable it in your browser settings and refresh the page."
          );
          return;
        }
      } catch (error) {
        console.error("Permission query error:", error);
      }
    }

    // Show info message before requesting
    if (!hasLocationPermission) {
      showAlert(
        "info",
        "Permission Needed",
        "Please allow location access when prompted by your browser."
      );
    }

    // Request location (this will trigger permission prompt if needed)
    getRealDeviceLocation();
  };

  // ---------------------------
  // Emotion Detection - FIXED WITH FALLBACK
  // ---------------------------
  // Enhanced local emotion detection as fallback
  const detectEmotionLocally = (text) => {
    const lowerText = text.toLowerCase();

    const emotionPatterns = {
      happy: [
        "happy",
        "good",
        "great",
        "awesome",
        "wonderful",
        "fantastic",
        "excellent",
        "amazing",
        "joy",
        "pleased",
        "delighted",
        "ecstatic",
        "love",
        "nice",
        "beautiful",
        "perfect",
        "smile",
        "laugh",
        "fun",
      ],
      sad: [
        "sad",
        "bad",
        "upset",
        "unhappy",
        "depressed",
        "miserable",
        "heartbroken",
        "grief",
        "sorrow",
        "tear",
        "cry",
        "unfortunate",
        "disappointed",
        "hopeless",
        "lonely",
        "alone",
        "miss",
        "lost",
      ],
      angry: [
        "angry",
        "mad",
        "frustrated",
        "annoyed",
        "irritated",
        "furious",
        "outraged",
        "rage",
        "hate",
        "disgusted",
        "bitter",
        "resentful",
        "angry",
        "hate",
        "dislike",
        "cant stand",
        "pissed",
        "annoying",
      ],
      scared: [
        "scared",
        "afraid",
        "fear",
        "terrified",
        "frightened",
        "panicked",
        "nervous",
        "anxious",
        "worried",
        "threatened",
        "intimidated",
        "anxiety",
        "panic",
        "nervous",
        "worried",
        "concerned",
        "uneasy",
      ],
      distressed: [
        "help",
        "emergency",
        "danger",
        "dangerous",
        "urgent",
        "critical",
        "accident",
        "attack",
        "hurt",
        "pain",
        "injured",
        "trapped",
        "bleeding",
        "hospital",
        "doctor",
        "police",
        "ambulance",
        "fire",
      ],
    };

    for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return emotion;
      }
    }

    return "neutral";
  };

  const detectEmotion = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition)
      return showAlert("error", "Failed", "No voice API.");

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = async (event) => {
      const text = event.results[0][0].transcript;

      try {
        // Try AI emotion detection first
        const emotionRes = await api.post("/ai/emotion", { text });
        const detectedEmotion = emotionRes.data.emotion;

        const formatted = getEmotionDisplay(detectedEmotion);
        setEmotion(formatted);
        localStorage.setItem("currentEmotion", formatted);

        window.dispatchEvent(
          new CustomEvent("emotionUpdate", {
            detail: { emotion: detectedEmotion },
          })
        );

        // 🔹 STORE EMOTION ACTIVITY IN BACKEND
        try {
          await api.post("/activities/store-activity", {
            userId: user?._id,
            activityType: "emotion_detection",
            data: {
              emotion: detectedEmotion,
              confidence: emotionRes.data.confidence || 0.8,
              text: text,
              batteryLevel: batteryLevel,
            },
          });
          console.log("😊 Emotion activity stored in backend");
        } catch (storeError) {
          console.error("❌ Failed to store emotion activity:", storeError);
        }

        showAlert("success", "Emotion Detected", formatted);
      } catch (err) {
        console.error(
          "AI emotion detection failed, using local detection:",
          err
        );

        // Fallback to local emotion detection
        const detectedEmotion = detectEmotionLocally(text);
        const formatted = getEmotionDisplay(detectedEmotion);

        setEmotion(formatted);
        localStorage.setItem("currentEmotion", formatted);

        // 🔹 STORE EMOTION ACTIVITY IN BACKEND (Fallback)
        try {
          await api.post("/activities/store-activity", {
            userId: user?._id,
            activityType: "emotion_detection",
            data: {
              emotion: detectedEmotion,
              confidence: 0.6,
              text: text,
              batteryLevel: batteryLevel,
            },
          });
          console.log(
            "😊 Emotion activity stored in backend (local detection)"
          );
        } catch (storeError) {
          console.error("❌ Failed to store emotion activity:", storeError);
        }

        showAlert(
          "info",
          "Emotion Detected",
          `${formatted} (using local detection)`
        );
      }
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      showAlert("error", "Voice Error", "Could not process your voice.");
    };

    rec.start();
  };

  // ---------------------------
  // Family Email Verification - FIXED ERROR HANDLING
  // ---------------------------
  const verifyFamilyEmail = async () => {
    if (!familyEmail.trim())
      return showAlert("warning", "Required", "Enter a valid email address.");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(familyEmail.trim())) {
      return showAlert(
        "error",
        "Invalid Email",
        "Please enter a valid email address."
      );
    }

    try {
      // Debug: Check authentication
      console.log("🔍 Family Email - User:", user);
      console.log("🔍 Family Email - Token exists:", !!localStorage.getItem("token"));

      // Verify family email
      const res = await api.post("/auth/verify-family", {
        email: familyEmail.trim(),
      });

      setVerifyMsg(res.data.msg);

      // Add family member - FIXED: Check if user exists and send proper data
      const addFamilyResponse = await api.post("/auth/add-family-test", {
        userId: user?._id || user?.id,
        familyEmail: familyEmail.trim(),
        userName: user?.name || "User",
      });

      // Update local state
      const updated = [...familyList, familyEmail.trim()];
      setFamilyList(updated);
      localStorage.setItem("familyEmails", JSON.stringify(updated));

      setFamilyEmail("");
      setVerifyMsg("");
      showAlert("success", "Success", "Family member added successfully!");
    } catch (err) {
      console.error("Family email error:", err);
      console.error("❌ Error details:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);

      if (err.response?.status === 400) {
        setVerifyMsg("Email already exists or invalid format ❌");
        showAlert("error", "Failed", "Email already exists or is invalid.");
      } else if (err.response?.status === 401) {
        setVerifyMsg("Authentication Failed ❌");
        showAlert("error", "Auth Error", "Please log in again to add family members.");
      } else {
        setVerifyMsg("Verification Failed ❌");
        showAlert(
          "error",
          "Failed",
          "Could not verify email. Please try again."
        );
      }
    }
  };

  const handleRemoveFamily = (email) => {
    const updated = familyList.filter((e) => e !== email);
    setFamilyList(updated);
    localStorage.setItem("familyEmails", JSON.stringify(updated));
    showAlert("info", "Removed", `${email} removed from family list.`);
  };

  // Safety score color helper
  const getSafetyScoreColor = (score) => {
    if (score >= 8) return "#10b981"; // Green
    if (score >= 6) return "#f59e0b"; // Yellow
    if (score >= 4) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getRiskBadgeClass = (riskLevel) => {
    if (!riskLevel) return "low";
    const level = riskLevel.toLowerCase();
    if (level.includes("high")) return "high";
    if (level.includes("medium")) return "medium";
    return "low";
  };

  // Card animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.03, y: -5 },
    tap: { scale: 0.98 },
  };

  return (
    <>
      <div className="dash-wrap">
        {/* Header Section */}
        <motion.div
          className="dash-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="user-greeting">
            <motion.div
              className="avatar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart size={24} />
            </motion.div>
            <div className="greeting-text">
              <h1 className="dash-title">
                Welcome back, {user?.name || "User"}! 💜
              </h1>
              <p className="dash-sub">
                Your safety is our priority. Stay protected with AI-powered
                features.
              </p>
            </div>
          </div>

          <div className="status-bar">
            <div className="status-item">
              <Clock size={16} />
              <span>{currentTime}</span>
            </div>
            {batteryLevel && (
              <div className="status-item">
                <Zap size={16} />
                <span>{batteryLevel}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="dash-grid">
          {/* SOS Card - Always First */}
          <motion.div
            className="dash-card danger"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setActiveCard("sos")}
            onHoverEnd={() => setActiveCard(null)}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="card-header">
              <div className="card-icon danger">
                <AlertTriangle size={28} />
              </div>
              <div className="card-badge emergency">EMERGENCY</div>
            </div>
            <h3>Emergency SOS</h3>
            <p>
              Immediate alert with location sharing to authorities and family
            </p>
            <button
              className="btn-danger large"
              onClick={() => handleSOS(false)}
              onTouchStart={() => setActiveCard("sos")}
            >
              <Send size={20} />
              <span>Send SOS</span>
            </button>
            <div className="card-footer">
              <span>🚨 Press & hold for 3 seconds</span>
            </div>
          </motion.div>

          {/* Voice Control Card */}
          <motion.div
            className="dash-card voice"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onHoverStart={() => setActiveCard("voice")}
            onHoverEnd={() => setActiveCard(null)}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="card-header">
              <div className="card-icon voice">
                {listening ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </div>
              <div className={`card-badge ${listening ? "active" : ""}`}>
                {listening ? "LISTENING" : "VOICE"}
              </div>
            </div>
            <h3>Voice Control</h3>
            <p>Hands-free emergency activation and commands</p>

            <div className="voice-controls">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={allowBackgroundListening}
                  onChange={(e) =>
                    setAllowBackgroundListening(e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
                <span>Background Listening</span>
              </label>

              <div className="voice-buttons">
                <button
                  className={`btn-primary ${listening ? "active" : ""}`}
                  onClick={listening ? stopActiveVoice : startActiveVoice}
                >
                  {listening ? (
                    <>
                      <div className="pulse-dot"></div>
                      Stop Listening
                    </>
                  ) : (
                    "Start Voice Mode"
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* REAL DEVICE LOCATION CARD */}
          <motion.div
            className="dash-card location-enhanced"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="card-header">
              <div className="card-icon location">
                <Satellite size={28} />
              </div>
              <div className="location-status-indicator">
                {locationLoading ? (
                  <div className="pulse-dot"></div>
                ) : locationDetails ? (
                  <Compass size={16} color="#10b981" />
                ) : (
                  <Map size={16} color="#6b7280" />
                )}
              </div>
            </div>

            <h3>📍 My Device Location</h3>
            <p>Get real-time safety analysis of your current location</p>

            <div className="location-content">
              <div className="location-display">
                <p className="location-text">{location}</p>

                {locationDetails && (
                  <div className="location-details">
                    {/* Real Address Display */}
                    <div className="address-details">
                      <Building size={14} />
                      <span>
                        <strong>{locationDetails.formattedAddress}</strong>
                      </span>
                    </div>

                    {/* City & Area Info */}
                    <div className="area-info">
                      <Navigation size={14} />
                      <span>
                        {locationDetails.areaName &&
                          `${locationDetails.areaName}, `}
                        {locationDetails.cityName}
                        {locationDetails.state && `, ${locationDetails.state}`}
                        {locationDetails.country &&
                          `, ${locationDetails.country}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="location-actions">
                <button
                  className="btn-primary"
                  onClick={requestLocationPermission}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <>
                      <div className="spinning">
                        <Compass size={16} />
                      </div>
                      Getting Location...
                    </>
                  ) : !hasLocationPermission ? (
                    <>
                      <Shield size={18} />
                      Allow Location Access
                    </>
                  ) : (
                    <>
                      <Locate size={18} />
                      Get My Location
                    </>
                  )}
                </button>

                {locationDetails && (
                  <button
                    className="btn-outline small"
                    onClick={() => navigate("/crime-analysis")}
                  >
                    <Navigation2 size={14} />
                    Detailed Report
                  </button>
                )}
              </div>
              <button
                className="btn-outline small"
                onClick={testActualLocation}
                style={{ marginTop: "10px" }}
              >
                🐛 Debug My Location
              </button>
            </div>

            {/* Permission Help Text - IMPROVED */}
            {!hasLocationPermission && (
              <div className="permission-help">
                <p>
                  🔍 <strong>Location Permission Required</strong>
                </p>
                <p>
                  Please allow location access in your browser to see your current location and safety analysis.
                </p>
                <div className="permission-steps">
                  <small>
                    • Click the location icon in your browser's address bar<br/>
                    • Select "Allow" for location access<br/>
                    • Or check browser settings → Privacy → Location
                  </small>
                </div>
              </div>
            )}
          </motion.div>

          {/* Crime Prediction Card */}
          <motion.div
            className="dash-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="card-header">
              <div className="card-icon ai">
                <Brain size={28} />
              </div>
              <div
                className={`risk-badge ${getRiskBadgeClass(locationDetails?.riskLevel)}`}
              >
                {crimeRisk}
              </div>
            </div>
            <h3>AI Safety Predictor</h3>
            <p>ML-powered crime risk assessment for your area</p>

            {locationDetails?.confidence && (
              <div className="confidence-score">
                <span>
                  AI Confidence: {(locationDetails.confidence * 100).toFixed(0)}
                  %
                </span>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={() => navigate("/crime-analysis")}
            >
              <Shield size={18} />
              <span>Analyze Area</span>
            </button>
            
            <button
              className="btn-outline small"
              onClick={() => setShowAnalysisHistory(true)}
              style={{ marginTop: "8px" }}
            >
              <History size={14} />
              <span>View History</span>
            </button>
          </motion.div>

          {/* Emotion Detection Card */}
          <motion.div
            className="dash-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="card-header">
              <div className="card-icon emotion">
                <Smile size={28} />
              </div>
              <div className="emotion-display">{emotion}</div>
            </div>
            <h3>Emotion Detection</h3>
            <p>Your current emotional state for better assistance</p>
            <p className="emotion-note">
              💡 Talk to CyberSathi to auto-update mood
            </p>
            <button className="btn-outline" onClick={detectEmotion}>
              <Mic size={18} />
              <span>Detect Mood</span>
            </button>
          </motion.div>

          {/* Awareness Card */}
          <motion.div
            className="dash-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="card-header">
              <div className="card-icon awareness">
                <ShieldCheck size={28} />
              </div>
            </div>
            <h3>Safety Resources</h3>
            <p>Cyber awareness, legal help, and safety guidelines</p>
            <div className="link-row">
              <button
                className="btn-light"
                onClick={() => navigate("/awareness")}
              >
                <span>Safety Tips</span>
              </button>
              <button
                className="btn-light"
                onClick={() => navigate("/legal-guidance")}
              >
                <span>Legal Help</span>
              </button>
            </div>
          </motion.div>

          {/* Family Network Card */}
          <motion.div
            className="dash-card family"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="card-header">
              <div className="card-icon family">
                <Users size={28} />
              </div>
              <div className="family-count">{familyList.length}</div>
            </div>
            <h3>Family Safety Network</h3>
            <p>Trusted contacts for emergency notifications</p>

            <div className="family-section">
              <div className="email-input">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Family member email..."
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && verifyFamilyEmail()}
                />
                <button
                  className="btn-primary small"
                  onClick={verifyFamilyEmail}
                  disabled={!familyEmail.trim()}
                >
                  <UserPlus size={16} />
                </button>
              </div>

              <AnimatePresence>
                {verifyMsg && (
                  <motion.p
                    className="verify-msg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {verifyMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              {familyList.length > 0 && (
                <div className="family-list">
                  {familyList.map((email, index) => (
                    <motion.div
                      key={index}
                      className="family-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span>{email}</span>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveFamily(email)}
                        aria-label={`Remove ${email}`}
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Assistant Buttons */}
        <div className="assistant-buttons">
          <motion.button
            className="assistant-btn primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIAssistant(true)}
          >
            <Bot size={20} />
            <span>Ask CyberSathi</span>
          </motion.button>

          <motion.button
            className="assistant-btn secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTalkingAssistant(true)}
          >
            <Mic size={20} />
            <span>Voice Chat</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showAnalysisHistory && (
          <AnalysisHistory 
            userId={user?._id || user?.id} 
            onClose={() => setShowAnalysisHistory(false)} 
          />
        )}
      </AnimatePresence>

      {/* Assistant Popups */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            className="assistant-wrapper top-assistant"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <AIAssistant onClose={() => setShowAIAssistant(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTalkingAssistant && (
          <motion.div
            className="assistant-wrapper bottom-assistant"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <TalkingAssistant onClose={() => setShowTalkingAssistant(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserDashboard;
