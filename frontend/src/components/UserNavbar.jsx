import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HeartHandshake,
  User,
  LogOut,
  Home,
  Bot,
  Menu,
  X,
  Shield,
  MessageCircle,
} from "lucide-react";
import "../styles/UserNavbar.css";
import TalkingAssistant from "../components/TalkingAssistant";

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAssistant, setShowAssistant] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.nav-right') && !event.target.closest('.menu-icon')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userLogout"));
    navigate("/");
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* 🌐 Enhanced Top Navbar */}
      <nav className={`user-nav ${scrolled ? "scrolled" : ""} ${menuOpen ? "menu-open" : ""}`}>
        <div className="nav-container">
          {/* Logo Section */}
          <div className="nav-left" onClick={() => navigate("/dashboard")}>
            <div className="logo-wrapper">
              <HeartHandshake size={28} className="nav-icon" />
              <Shield size={16} className="logo-badge" />
            </div>
            <div className="logo-text">
              <h1>CyberSathi</h1>
              <span>Secure & Protected</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-right">
            <button
              className={`nav-btn ${isActiveRoute("/dashboard") ? "active" : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <Home size={20} />
              <span>Dashboard</span>
              {isActiveRoute("/dashboard") && <div className="active-indicator" />}
            </button>

            <button
              className={`nav-btn ${isActiveRoute("/profile") ? "active" : ""}`}
              onClick={() => navigate("/profile")}
            >
              <User size={20} />
              <span>{user?.name?.split(' ')[0] || "Profile"}</span>
              {isActiveRoute("/profile") && <div className="active-indicator" />}
            </button>

            <button
              className={`nav-btn ${isActiveRoute("/ai-assistant") ? "active" : ""}`}
              onClick={() => navigate("/ai-assistant")}
            >
              <Bot size={20} />
              <span>AI Assistant</span>
              {isActiveRoute("/ai-assistant") && <div className="active-indicator" />}
            </button>

            <button className="nav-btn logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div 
            className={`menu-icon ${menuOpen ? "open" : ""}`} 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="menu-icon-bar"></div>
            <div className="menu-icon-bar"></div>
            <div className="menu-icon-bar"></div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            <div className="user-info-mobile">
              <div className="user-avatar">
                <User size={24} />
              </div>
              <div className="user-details">
                <h3>{user?.name || "User"}</h3>
                <span>{user?.email || "Welcome back!"}</span>
              </div>
            </div>

            <div className="mobile-nav-buttons">
              <button
                className={`mobile-nav-btn ${isActiveRoute("/dashboard") ? "active" : ""}`}
                onClick={() => navigate("/dashboard")}
              >
                <Home size={22} />
                <span>Dashboard</span>
                <div className="btn-arrow">→</div>
              </button>

              <button
                className={`mobile-nav-btn ${isActiveRoute("/profile") ? "active" : ""}`}
                onClick={() => navigate("/profile")}
              >
                <User size={22} />
                <span>My Profile</span>
                <div className="btn-arrow">→</div>
              </button>

              <button
                className={`mobile-nav-btn ${isActiveRoute("/ai-assistant") ? "active" : ""}`}
                onClick={() => navigate("/ai-assistant")}
              >
                <Bot size={22} />
                <span>AI Assistant</span>
                <div className="btn-arrow">→</div>
              </button>

              <button 
                className="mobile-nav-btn ai-chat-btn"
                onClick={() => setShowAssistant(true)}
              >
                <MessageCircle size={22} />
                <span>Quick Chat</span>
                <div className="btn-badge">New</div>
              </button>

              <button className="mobile-nav-btn logout" onClick={handleLogout}>
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 💬 Enhanced Floating AI Assistant Button */}
      <div
        className={`floating-ai-btn ${showAssistant ? "active" : ""}`}
        onClick={() => setShowAssistant(!showAssistant)}
        title="Talk with CyberSathi"
      >
        <div className="floating-btn-inner">
          <Bot size={24} />
        </div>
        <div className="pulse-ring"></div>
        <div className="floating-tooltip">Ask me anything!</div>
      </div>

      {/* 👩‍💜 Talking Assistant Popup */}
      {showAssistant && <TalkingAssistant onClose={() => setShowAssistant(false)} />}
      
      {/* Overlay for mobile menu */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)}></div>}
    </>
  );
};

export default UserNavbar;