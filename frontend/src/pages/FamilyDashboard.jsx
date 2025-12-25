import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  AlertTriangle,
  Shield,
  AudioLines,
  HeartPulse,
  Siren,
  Users,
  Clock,
  Navigation,
  Phone,
  MessageCircle,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Satellite,
  Activity,
  Building,
  Navigation2,
  Brain,
  Locate,
  Compass,
} from "lucide-react";
import "../styles/FamilyDashboard.css";
import { io } from "socket.io-client";
import api from "../api/apiclient";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const FamilyDashboard = () => {
  const [familyUser, setFamilyUser] = useState(null);
  const [sosAlert, setSosAlert] = useState(false);
  const [sosTime, setSosTime] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdate, setLastUpdate] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlayError, setAudioPlayError] = useState(false);

  // State for selected Sakhi and their data
  const [selectedSakhi, setSelectedSakhi] = useState(null);
  const [selectedSakhiData, setSelectedSakhiData] = useState(null);
  const [locationAnalysis, setLocationAnalysis] = useState(null); // New state for detailed location
  const [locationLoading, setLocationLoading] = useState(false);
  const [emotionState, setEmotionState] = useState({ data: null, loading: false, error: null });
  const [crimeAnalysisData, setCrimeAnalysisData] = useState(null); // New state for crime analysis
  const [crimeAnalysisLoading, setCrimeAnalysisLoading] = useState(false);

  // 🔹 NEW: Device Status States
  const [currentTime, setCurrentTime] = useState("");
  const [networkStatus, setNetworkStatus] = useState("online");
  const [deviceBattery, setDeviceBattery] = useState({ level: null, charging: false });

  const [risk, setRisk] = useState("Low Risk");
  const [batteryLevel, setBatteryLevel] = useState("");

  const getEmotionDisplay = (emotion) => {
    const emotionMap = {
      happy: "😊 Happy", sad: "😢 Sad", angry: "😠 Angry", scared: "😨 Scared",
      distressed: "😰 Distressed", neutral: "😐 Neutral"
    };
    return emotionMap[emotion] || "😐 Neutral";
  };

  const [sakhiList, setSakhiList] = useState([]);
  const [sosData, setSosData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const audioRef = useRef(null);
  const socketRef = useRef(null);

  // 🔹 NEW: Device Status Effects
  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Monitor network status
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? "online" : "offline");
    };

    // Check battery status (if supported)
    const updateBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setDeviceBattery({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });

          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            setDeviceBattery(prev => ({
              ...prev,
              level: Math.round(battery.level * 100)
            }));
          });

          battery.addEventListener('chargingchange', () => {
            setDeviceBattery(prev => ({
              ...prev,
              charging: battery.charging
            }));
          });
        } catch (error) {
          console.log("Battery API not supported:", error);
        }
      }
    };

    // Initialize device status
    updateNetworkStatus();
    updateBatteryStatus();
    setCurrentTime(new Date().toLocaleTimeString());

    // Add network event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      const u = JSON.parse(localStorage.getItem("user"));
      setFamilyUser(u);
      setLastUpdate(new Date().toLocaleTimeString());
      await fetchSakhiUsers(u?.email);
      const savedRisk = localStorage.getItem("predictedRisk");
      if (savedRisk) setRisk(savedRisk);
      initializeSocketConnection(u);
      startPolling();
    };
    initializeDashboard();
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (selectedSakhi) {
      setLocationLoading(true);
      setEmotionState(prev => ({ ...prev, loading: true }));
      setCrimeAnalysisLoading(true);
      Promise.all([
        fetchSakhiData(selectedSakhi._id),
        fetchLocationAnalysis(selectedSakhi._id),
        fetchEmotionData(selectedSakhi._id),
        fetchCrimeAnalysisData(selectedSakhi._id), // New function to fetch crime analysis
      ]).finally(() => {
        setLocationLoading(false);
        setCrimeAnalysisLoading(false);
      });
    }
  }, [selectedSakhi]);

  const fetchSakhiUsers = async (email) => {
    try {
      if (!email) return;
      const res = await api.get(`/auth/sakhi-users-test?familyEmail=${encodeURIComponent(email)}`);
      const sakhis = res.data.sakhiUsers || [];
      setSakhiList(sakhis);

      if (sakhis.length > 0) {
        setSelectedSakhi(sakhis[0]);
        addActivity(`Connected with ${sakhis.length} Sakhi user(s)`);
      }
    } catch (err) {
      console.error("Failed to fetch sakhi users:", err);
      addActivity("Failed to load Sakhi connections");
    }
  };

  const fetchSakhiData = async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get(`/user-data/${userId}`);
      if (res.data.success) {
        setSelectedSakhiData(res.data.data);
        if (res.data.data && res.data.data.userId) {
          addActivity(`Updated snapshot for ${res.data.data.userId.name}`);
        }
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Failed to fetch Sakhi snapshot data:", error);
      addActivity(`Failed to get snapshot for selected Sakhi`);
    }
  };

  const fetchLocationAnalysis = async (userId) => {
    if (!userId) return;
    
    console.log("🔍 FamilyDashboard - Fetching location for userId:", userId);
    
    try {
      // First try to get the latest stored location from UserData
      console.log("🔍 Trying UserData location endpoint...");
      const locationRes = await api.get(`/user-data/${userId}/location-latest-test`);
      
      console.log("🔍 UserData location response:", locationRes.data);
      
      if (locationRes.data.success && locationRes.data.location) {
        console.log("✅ Found location in UserData:", locationRes.data.location);
        setLocationAnalysis({
          data: {
            locationData: {
              coordinates: locationRes.data.location.coordinates,
              address: locationRes.data.location.address,
              safetyScore: locationRes.data.location.safetyScore,
              riskLevel: locationRes.data.location.riskLevel,
              riskFactors: locationRes.data.location.riskFactors || [],
              recommendations: locationRes.data.location.recommendations || [],
              areaType: locationRes.data.location.areaType,
              confidence: locationRes.data.location.confidence,
              accuracy: locationRes.data.location.accuracy,
              timestamp: locationRes.data.location.timestamp,
            }
          }
        });
        addActivity(`Fetched latest location from UserData storage.`);
        return;
      }

      // Fallback: Try to get from activities (UserActivity collection)
      console.log("🔍 Trying UserActivity collection...");
      const activitiesRes = await api.get(`/activities/user-activities?userId=${userId}&activityType=location_analysis&limit=1`);
      
      console.log("🔍 UserActivity response:", activitiesRes.data);
      
      if (activitiesRes.data.success && activitiesRes.data.activities.length > 0) {
        const activity = activitiesRes.data.activities[0];
        console.log("✅ Found location activity:", activity);
        
        // Check if the activity has location data
        if (activity.data && activity.data.locationData) {
          setLocationAnalysis({
            data: {
              locationData: {
                coordinates: activity.data.locationData.coordinates,
                address: activity.data.locationData.address,
                safetyScore: activity.data.locationData.safetyScore,
                riskLevel: activity.data.locationData.riskLevel,
                riskFactors: activity.data.locationData.riskFactors || [],
                recommendations: activity.data.locationData.recommendations || [],
                areaType: activity.data.locationData.areaType,
                confidence: activity.data.locationData.confidence,
                accuracy: activity.data.locationData.accuracy,
                timestamp: activity.timestamp,
              }
            }
          });
          addActivity(`Fetched location analysis from activities.`);
          return;
        } else {
          console.log("⚠️ Activity found but no locationData:", activity);
        }
      }

      // Try to get any recent activities to debug
      console.log("🔍 Checking all recent activities for debugging...");
      const allActivitiesRes = await api.get(`/activities/user-activities?userId=${userId}&limit=5`);
      console.log("🔍 All recent activities:", allActivitiesRes.data);

      setLocationAnalysis(null);
      addActivity(`No location data available for this user.`);
      
    } catch (error) {
      console.error("❌ Failed to fetch location analysis:", error);
      console.error("❌ Error details:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      setLocationAnalysis(null);
      addActivity(`Failed to get location data: ${error.message}`);
    }
  };

    const fetchEmotionData = async (userId) => {
        if (!userId) return;
        setEmotionState({ data: null, loading: true, error: null });
        try {
            const res = await api.get(`/activities/user-activities?userId=${userId}&activityType=emotion_detection&limit=1`);
            if (res.data.success && res.data.activities.length > 0) {
                setEmotionState({ data: res.data.activities[0], loading: false, error: null });
                addActivity(`Fetched latest emotion state.`);
            } else {
                setEmotionState({ data: null, loading: false, error: 'No emotion data found.' });
            }
        } catch (error) {
            console.error("Failed to fetch emotion data:", error);
            setEmotionState({ data: null, loading: false, error: 'Failed to fetch emotion data.' });
            addActivity(`Failed to get emotion data.`);
        }
    };

  // 🔹 NEW: Fetch Crime Analysis Data from Database
  const fetchCrimeAnalysisData = async (userId) => {
    if (!userId) return;
    
    console.log("🔍 FamilyDashboard - Fetching crime analysis for userId:", userId);
    
    try {
      setCrimeAnalysisLoading(true);
      
      // Get latest crime analysis from database
      const crimeRes = await api.get(`/crime-analysis/latest/${userId}`);
      
      console.log("🔍 Crime analysis response:", crimeRes.data);
      
      if (crimeRes.data.success && crimeRes.data.analysis) {
        const analysis = crimeRes.data.analysis;
        setCrimeAnalysisData({
          riskScore: analysis.riskAssessment?.riskScore || 6,
          riskLevel: analysis.riskAssessment?.riskLevel || "Moderate Risk",
          safetyIndex: analysis.riskAssessment?.safetyIndex || 6,
          confidence: analysis.riskAssessment?.confidence || 0.7,
          location: analysis.location?.address?.formatted || "Unknown Location",
          timestamp: analysis.analysisTimestamp,
          crimeData: analysis.crimeData || {},
          riskFactors: analysis.riskFactors || [],
          recommendations: analysis.recommendations || [],
          dataQuality: analysis.dataQuality || {}
        });
        
        addActivity(`Fetched latest crime analysis from database.`);
        console.log("✅ Crime analysis data set:", crimeRes.data.analysis);
        
      } else {
        console.log("⚠️ No crime analysis found in database");
        setCrimeAnalysisData(null);
        addActivity(`No crime analysis data available for this user.`);
      }
      
    } catch (error) {
      console.error("❌ Failed to fetch crime analysis:", error);
      console.error("❌ Error details:", error.response?.data);
      setCrimeAnalysisData(null);
      addActivity(`Failed to get crime analysis: ${error.message}`);
    } finally {
      setCrimeAnalysisLoading(false);
    }
  };

  const initializeSocketConnection = (user) => {
    if (!user) return;

    socketRef.current = io(SOCKET_URL, {
      query: { userId: user.email }, // Use email to identify the family member on the backend
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      addActivity(`Socket connected: ${socketRef.current.id}`);
      console.log("Family dashboard connected to socket server.");
      // The backend should handle joining the correct room based on the userId query
    });

    socketRef.current.on("disconnect", () => {
      setConnectionStatus("disconnected");
      addActivity("Socket disconnected");
      console.log("Family dashboard disconnected from socket server.");
    });

    socketRef.current.on("sos_triggered", (data) => {
      console.log("SOS Alert Received:", data);
      setSosData(data);
      setSosAlert(true);
      setAudioPlayError(false); // Reset on new SOS
      setSosTime(new Date().toLocaleTimeString());
      addActivity(`🚨 SOS received from ${data.userName || "a user"}`);
      
      // Play sound
      if (audioRef.current && !isMuted) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Audio play failed:", error);
                setAudioPlayError(true);
            });
        }
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
      addActivity("Socket connection failed");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };

  const addActivity = (activity) => {
    const timestamp = new Date().toLocaleTimeString();
    setRecentActivities((prev) => [{ activity, timestamp }, ...prev.slice(0, 9)]);
  };
  
  const startPolling = () => {
    const interval = setInterval(() => {
      if (selectedSakhi) {
        fetchSakhiData(selectedSakhi._id);
        fetchLocationAnalysis(selectedSakhi._id);
        fetchEmotionData(selectedSakhi._id);
        fetchCrimeAnalysisData(selectedSakhi._id); // Add crime analysis polling
        addActivity(`Periodic data refresh for ${selectedSakhi.name}`);
      }
    }, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  };

  const refreshData = () => {
    addActivity("Manual refresh triggered");
    if (selectedSakhi) {
      setLocationLoading(true);
      setEmotionState(prev => ({ ...prev, loading: true }));
      setCrimeAnalysisLoading(true);
      Promise.all([
        fetchSakhiData(selectedSakhi._id),
        fetchLocationAnalysis(selectedSakhi._id),
        fetchEmotionData(selectedSakhi._id),
        fetchCrimeAnalysisData(selectedSakhi._id), // Add crime analysis refresh
      ]).finally(() => {
        setLocationLoading(false);
        setCrimeAnalysisLoading(false);
      });
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 7) return "#22c55e";
    if (score >= 4) return "#f59e0b";
    return "#ef4444";
  };

  const getRiskLevelColor = (riskLevel) => {
    if (!riskLevel) return "#6b7280";
    const level = riskLevel.toLowerCase();
    if (level.includes("low")) return "#22c55e";
    if (level.includes("moderate") || level.includes("medium")) return "#f59e0b";
    if (level.includes("high")) return "#ef4444";
    return "#6b7280";
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
  };

  // Prioritize detailed analysis, fallback to snapshot
  const locationDetails = locationAnalysis?.data?.locationData;
  const snapshotLocation = selectedSakhiData?.lastLocation;

  return (
    <div className="family-wrap">
       <audio ref={audioRef} src="/alert-sound.mp3" loop />
      <AnimatePresence>
        {sosAlert && (
          <motion.div 
            className="sos-alert-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="sos-alert-content"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sos-alert-header">
                <Siren className="sos-icon" size={48} />
                <h2>EMERGENCY SOS</h2>
              </div>
              <p className="sos-from">
                Alert from <strong>{sosData?.userName || 'a connected user'}</strong>
              </p>
              <div className="sos-details">
                <p><strong>Time:</strong> {sosTime}</p>
                <p><strong>Message:</strong> {sosData?.message || 'SOS Triggered'}</p>
                {sosData?.coords && (
                  <a 
                    href={`https://www.google.com/maps?q=${sosData.coords.lat},${sosData.coords.lon}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="map-link"
                  >
                    <MapPin size={16} />
                    View Location on Map
                  </a>
                )}
              </div>
              {audioPlayError && (
                <button className="play-sound-btn" onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.play().catch(e => console.error("Manual play failed", e));
                  }
                  setAudioPlayError(false);
                }}>
                  <Volume2 size={20} />
                  Play Sound
                </button>
              )}
              <button className="dismiss-btn" onClick={() => {
                setSosAlert(false);
                setAudioPlayError(false);
                if(audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
              }}>
                <X size={20} />
                Dismiss Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header and SOS Popup */}
      <motion.div className="family-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header-main">
          <div className="header-text">
            <h1 className="family-title">Family Safety Dashboard</h1>
            <p className="family-sub">
              Monitoring <strong>{selectedSakhi?.name || "your loved ones"}</strong>
              {selectedSakhiData && (
                <span style={{ marginLeft: '20px', display: 'inline-flex', alignItems: 'center', gap: '15px', fontSize: '14px', color: '#a0aec0' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    {selectedSakhiData.isOnline ? <Wifi size={16} color="#48bb78" /> : <WifiOff size={16} color="#f56565" />}
                    {' '}
                    {selectedSakhiData.isOnline ? 'Online' : 'Offline'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Battery size={16} />
                    {' '}
                    {selectedSakhiData.batteryLevel || 'N/A'}
                  </span>
                </span>
              )}
            </p>
            
            {/* 🔹 NEW: Device Status Bar */}
            <div className="device-status-bar">
              <div className="device-status-item">
                <Clock size={16} />
                <span>{currentTime}</span>
              </div>
              <div className={`device-status-item ${networkStatus === "online" ? "online" : "offline"}`}>
                {networkStatus === "online" ? (
                  <Wifi size={16} color="#10b981" />
                ) : (
                  <WifiOff size={16} color="#ef4444" />
                )}
                <span>{networkStatus === "online" ? "Connected" : "Offline"}</span>
              </div>
              {deviceBattery.level !== null ? (
                <div className={`device-status-item ${
                  deviceBattery.charging ? "charging" : 
                  deviceBattery.level <= 20 ? "low-battery" : ""
                }`}>
                  {deviceBattery.charging ? (
                    <BatteryCharging size={16} color="#10b981" />
                  ) : (
                    <Battery size={16} color={deviceBattery.level > 20 ? "#10b981" : "#ef4444"} />
                  )}
                  <span>{deviceBattery.level}%</span>
                </div>
              ) : (
                <div className="device-status-item">
                  <Battery size={16} color="#6b7280" />
                  <span>Battery N/A</span>
                </div>
              )}
            </div>
          </div>
          <div className="header-actions">
             <button className="mute-btn" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute Alerts" : "Mute Alerts"}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button className="refresh-btn" onClick={refreshData} title="Refresh data">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="family-grid">
        {/* LOCATION CARD */}
        <motion.div className="family-card loc-card" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <div className="card-header">
            <div className="card-icon"><Satellite size={24} /></div>
            <div className="card-badge">LIVE</div>
          </div>
          <h3>📍 Sakhi's Location</h3>
          <p>Analysis of <strong>{selectedSakhi?.name || "..."}</strong>'s location</p>

          <div className="location-content">
            {locationLoading ? (
              <div className="spinning"><Compass size={24} /><p>Fetching data...</p></div>
            ) : locationDetails ? (
              <div className="location-details">
                <div className="address-details">
                  <Building size={14} />
                  <span><strong>{locationDetails.address?.formatted || "Address unavailable"}</strong></span>
                </div>
                <div className="area-info">
                  <Navigation size={14} />
                  <span>
                    {locationDetails.address?.area && `${locationDetails.address.area}, `}
                    {locationDetails.address?.city}
                    {locationDetails.address?.state && `, ${locationDetails.address.state}`}
                    {locationDetails.address?.country && `, ${locationDetails.address.country}`}
                  </span>
                </div>
                {typeof locationDetails.safetyScore === 'number' && (
                  <div className="safety-indicator">
                    <div className="safety-score">
                      <Shield size={12} />
                      <span>Safety Score: {locationDetails.safetyScore.toFixed(1)}/10</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${locationDetails.safetyScore * 10}%`, backgroundColor: getSafetyScoreColor(locationDetails.safetyScore) }}></div>
                    </div>
                  </div>
                )}
                {locationDetails.riskFactors?.length > 0 && (
                  <div className="risk-factors">
                    <AlertTriangle size={12} />
                    <span>Factors: {locationDetails.riskFactors.join(", ")}</span>
                  </div>
                )}
                 {locationDetails.areaType && (
                    <div className="area-type">
                        <Navigation2 size={12} />
                        <span>Area Type: {locationDetails.areaType}</span>
                    </div>
                 )}
                 {locationDetails.accuracy && (
                    <div className="accuracy-info">
                        <Satellite size={12} />
                        <span>Accuracy: ±{Math.round(locationDetails.accuracy)}m</span>
                    </div>
                 )}
                 {locationDetails.timestamp && (
                    <div className="timestamp-info">
                        <Clock size={12} />
                        <span>Updated: {new Date(locationDetails.timestamp).toLocaleString()}</span>
                    </div>
                 )}
              </div>
            ) : snapshotLocation?.coordinates ? (
                 <div className="location-details">
                    <p>Displaying last known location snapshot:</p>
                    <div className="address-details">
                        <MapPin size={14} />
                        <span>{snapshotLocation.address?.formattedAddress || `Lat: ${snapshotLocation.coordinates.lat}, Lon: ${snapshotLocation.coordinates.lon}`}</span>
                    </div>
                    <p className="fallback-notice">No detailed analysis available. This is a basic location update.</p>
                 </div>
            ) : (
              <p className="location-text">Location data not available for {selectedSakhi?.name || "the user"}.</p>
            )}
            
            {/* Manual Refresh Button */}
            <div className="location-actions" style={{ marginTop: '15px' }}>
              <button 
                className="btn-outline small" 
                onClick={() => {
                  if (selectedSakhi) {
                    setLocationLoading(true);
                    fetchLocationAnalysis(selectedSakhi._id).finally(() => setLocationLoading(false));
                  }
                }}
                disabled={locationLoading || !selectedSakhi}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '12px',
                  padding: '5px 10px',
                  marginRight: '10px'
                }}
              >
                <RefreshCw size={12} />
                Refresh Location
              </button>
              
              {/* Debug Button */}
              <button 
                className="btn-outline small" 
                onClick={async () => {
                  if (selectedSakhi) {
                    try {
                      const debugRes = await api.get(`/user-data/${selectedSakhi._id}/debug-location`);
                      console.log("🔍 Debug response:", debugRes.data);
                      addActivity(`Debug: ${JSON.stringify(debugRes.data.debug)}`);
                    } catch (error) {
                      console.error("Debug failed:", error);
                      addActivity(`Debug failed: ${error.message}`);
                    }
                  }
                }}
                disabled={!selectedSakhi}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '12px',
                  padding: '5px 10px'
                }}
              >
                🐛 Debug DB
              </button>
            </div>
          </div>
        </motion.div>

        {/* Other cards using selectedSakhiData */}
        <motion.div className="family-card emo-card" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <div className="card-header"><div className="card-icon"><HeartPulse size={24} /></div></div>
          <h3>Emotional State</h3>
          {emotionState.loading ? (
            <div className="spinning"><Brain size={24} /><p>Analyzing...</p></div>
          ) : emotionState.data?.data?.emotionData?.emotion ? (
            <p className="mood-text">
              {getEmotionDisplay(emotionState.data.data.emotionData.emotion)}
            </p>
          ) : (
            <p className="mood-text">{emotionState.error || "😐 No data"}</p>
          )}
        </motion.div>
        
        <motion.div className="family-card risk-card" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <div className="card-header">
              <div className="card-icon"><Shield size={24}/></div>
              {crimeAnalysisLoading && <div className="pulse-dot"></div>}
            </div>
            <h3>Area Safety Score</h3>
            
            {crimeAnalysisLoading ? (
              <div className="spinning"><Brain size={24} /><p>Analyzing safety...</p></div>
            ) : crimeAnalysisData ? (
              <div className="crime-analysis-details">
                <div className="risk-level-display">
                  <p className="risk-text" style={{ color: getRiskLevelColor(crimeAnalysisData.riskLevel) }}>
                    {crimeAnalysisData.riskLevel}
                  </p>
                  <div className="risk-score">
                    <span>Risk Score: {crimeAnalysisData.riskScore}/10</span>
                  </div>
                </div>
                
                <div className="safety-bar">
                  <div 
                    className="safety-fill" 
                    style={{ 
                      width: `${(10 - crimeAnalysisData.riskScore) * 10}%`, 
                      backgroundColor: getSafetyScoreColor(10 - crimeAnalysisData.riskScore) 
                    }}
                  ></div>
                </div>
                
                {crimeAnalysisData.riskFactors?.length > 0 && (
                  <div className="risk-factors-mini">
                    <AlertTriangle size={12} />
                    <span>Factors: {crimeAnalysisData.riskFactors.slice(0, 2).join(", ")}</span>
                  </div>
                )}
                
                <div className="analysis-meta">
                  <div className="confidence-info">
                    <Brain size={12} />
                    <span>Confidence: {(crimeAnalysisData.confidence * 100).toFixed(0)}%</span>
                  </div>
                  {crimeAnalysisData.timestamp && (
                    <div className="timestamp-info">
                      <Clock size={12} />
                      <span>Updated: {new Date(crimeAnalysisData.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                {crimeAnalysisData.dataQuality?.analysisMethod && (
                  <div className="data-source">
                    <Activity size={12} />
                    <span>Source: {crimeAnalysisData.dataQuality.analysisMethod}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-analysis">
                <p className="risk-text">No Analysis Available</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  Crime analysis not found for this user
                </p>
              </div>
            )}
            
            {/* Manual Refresh Button for Crime Analysis */}
            <div className="crime-analysis-actions" style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
              <button 
                className="btn-outline small" 
                onClick={() => {
                  if (selectedSakhi) {
                    setCrimeAnalysisLoading(true);
                    fetchCrimeAnalysisData(selectedSakhi._id).finally(() => setCrimeAnalysisLoading(false));
                  }
                }}
                disabled={crimeAnalysisLoading || !selectedSakhi}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '12px',
                  padding: '5px 10px'
                }}
              >
                <RefreshCw size={12} />
                Refresh Analysis
              </button>
              
              {/* Debug Crime Analysis Button */}
              <button 
                className="btn-outline small" 
                onClick={async () => {
                  if (selectedSakhi) {
                    try {
                      const historyRes = await api.get(`/crime-analysis/history/${selectedSakhi._id}?limit=3`);
                      console.log("🔍 Crime Analysis History:", historyRes.data);
                      addActivity(`Debug: Found ${historyRes.data.analyses?.length || 0} analyses in database`);
                    } catch (error) {
                      console.error("Debug failed:", error);
                      addActivity(`Debug failed: ${error.message}`);
                    }
                  }
                }}
                disabled={!selectedSakhi}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '12px',
                  padding: '5px 10px'
                }}
              >
                🔍 Debug Crime DB
              </button>
            </div>
        </motion.div>
        
        <motion.div className={`family-card sos-card ${sosAlert ? 'active' : ''}`} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <div className="card-header"><div className="card-icon"><Siren size={24}/></div></div>
            <h3>Emergency Status</h3>
            <p className="sos-status">{sosAlert ? "🚨 Active SOS" : "✅ All Clear"}</p>
        </motion.div>

        {/* CONNECTED USERS CARD */}
        <motion.div className="family-card users-card" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <div className="card-header"><div className="card-icon"><Users size={24} /></div><div className="users-count">{sakhiList.length}</div></div>
          <h3>Connected Sakhi</h3>
          <div className="users-list">
            {sakhiList.length > 0 ? sakhiList.map((sakhi) => (
              <div key={sakhi._id} className={`user-item ${selectedSakhi?._id === sakhi._id ? "selected" : ""}`} onClick={() => setSelectedSakhi(sakhi)}>
                <div className="user-avatar">{sakhi.name.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <span className="user-name">{sakhi.name}</span>
                  <span className="user-email">{sakhi.email}</span>
                </div>
              </div>
            )) : <p className="no-users">No connected users</p>}
          </div>
        </motion.div>

        {/* ACTIVITY FEED CARD */}
        <motion.div className="family-card activity-card" variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <div className="card-header"><div className="card-icon"><AudioLines size={24} /></div></div>
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content"><p>{activity.activity}</p><span className="activity-time">{activity.timestamp}</span></div>
              </div>
            )) : <div className="empty-activities"><p>No recent activities</p></div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FamilyDashboard;