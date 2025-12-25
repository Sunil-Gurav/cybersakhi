import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 🔹 Components
import Navbar from "./components/Navbar";
import UserNavbar from "./components/UserNavbar";
import Footer from "./components/Footer";
import BackendStatus from "./components/BackendStatus"; // 🔍 Backend status checker

// 🏠 Pages
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Awareness from "./pages/Awareness";
import LegalGuidance from "./pages/LegalGuidance";
import UserDashboard from "./pages/UserDashboard";
import CrimeAnalysis from "./pages/CrimeAnalysis";
import EmotionAi from "./pages/EmotionAI";
import Profile from "./pages/Profile";
import AIAssistantPage from "./pages/AIAssistantPage";

// ⭐ Import NEW Family Dashboard
import FamilyDashboard from "./pages/FamilyDashboard";

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const isLoggedIn = !!user;
  const role = user?.role || "guest";

  // Listen for login/logout events to update state
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };

    window.addEventListener("userLogin", handleStorageChange);
    window.addEventListener("userLogout", handleStorageChange);

    return () => {
      window.removeEventListener("userLogin", handleStorageChange);
      window.removeEventListener("userLogout", handleStorageChange);
    };
  }, []);

  return (
    <Router>
      {/* 🔍 Backend Status Checker */}
      <BackendStatus />
      
      {/* 🧭 Conditional Navbar */}
      {isLoggedIn ? <UserNavbar /> : <Navbar />}

      <div className="pt-20 min-h-screen">
        <Routes>
          {/* 🌍 Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />

          {/* 🔐 Login Route */}
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                role === "family" ? (
                  <Navigate to="/fam-dashboard" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              ) : (
                <Login />
              )
            }
          />

          <Route path="/awareness" element={<Awareness />} />
          <Route path="/legal-guidance" element={<LegalGuidance />} />

          {/* 🤖 AI Assistant Full Page */}
          <Route
            path="/ai-assistant"
            element={isLoggedIn ? <AIAssistantPage /> : <Navigate to="/login" />}
          />

          {/* 🧍‍♀️ Sakhi Dashboard */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn && role === "sakhi" ? (
                <UserDashboard />
              ) : isLoggedIn ? (
                <Navigate to="/fam-dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/crime-analysis"
            element={isLoggedIn ? <CrimeAnalysis /> : <Navigate to="/login" />}
          />

          <Route
            path="/emotion-analysis"
            element={isLoggedIn ? <EmotionAi /> : <Navigate to="/login" />}
          />

          <Route
            path="/profile"
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
          />

          {/* 👨‍👩‍👧 FAMILY DASHBOARD (FULL FEATURE PAGE) */}
          <Route
            path="/fam-dashboard"
            element={
              isLoggedIn && role === "family" ? (
                <FamilyDashboard />
              ) : isLoggedIn ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* 🚦 Default redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* 🌍 Global Footer */}
      <Footer />
    </Router>
  );
};

export default App;
