import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Shield, 
  Phone, 
  Mail, 
  Home, 
  BookOpen, 
  Scale, 
  LogIn,
  MapPin,
  Smartphone
} from "lucide-react";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="footer-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Decoration */}
      <div className="footer-bg-pattern"></div>
      
      <div className="footer-content">
        {/* Brand Section */}
        <motion.div 
          className="footer-brand"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="brand-logo">
            <Shield className="logo-icon" />
            <h2>CyberSathi</h2>
          </div>
          <p className="brand-tagline">
            Your AI-Powered Women Safety Companion
          </p>
          <div className="brand-features">
            <span className="feature-tag">24/7 Protection</span>
            <span className="feature-tag">AI Assistant</span>
            <span className="feature-tag">Instant Help</span>
          </div>
        </motion.div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4 className="links-title">
            <MapPin className="link-icon" />
            Quick Navigation
          </h4>
          <div className="links-grid">
            <Link to="/" className="footer-link">
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link to="/awareness" className="footer-link">
              <BookOpen size={16} />
              <span>Awareness</span>
            </Link>
            <Link to="/legal-guidance" className="footer-link">
              <Scale size={16} />
              <span>Legal Help</span>
            </Link>
            <Link to="/login" className="footer-link">
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="footer-emergency">
          <h4 className="emergency-title">
            <Phone className="emergency-icon" />
            Emergency Contacts
          </h4>
          <div className="emergency-contacts">
            <div className="contact-item">
              <span className="contact-label">Women Helpline</span>
              <a href="tel:1091" className="contact-number emergency">1091</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">National Emergency</span>
              <a href="tel:112" className="contact-number emergency">112</a>
            </div>
            <div className="contact-item">
              <span className="contact-label">Police</span>
              <a href="tel:100" className="contact-number">100</a>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="footer-support">
          <h4 className="support-title">
            <Mail className="support-icon" />
            Support & Help
          </h4>
          <div className="support-content">
            <a 
              href="mailto:cybersathi.support@gmail.com" 
              className="support-email"
            >
              <Mail size={14} />
              cybersathi.support@gmail.com
            </a>
            <p className="support-text">
              Available 24/7 for your safety and support
            </p>
            <div className="app-badge">
              <Smartphone size={14} />
              <span>Mobile Friendly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div 
        className="footer-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="footer-bottom-content">
          <p className="copyright">
            © {currentYear} CyberSathi. All rights reserved.
          </p>
          <motion.p 
            className="footer-tag"
            whileHover={{ scale: 1.05 }}
          >
            <Heart className="heart-icon" />
            Made with love for Women's Safety
            <Heart className="heart-icon" />
          </motion.p>
          <div className="footer-security">
            <Shield size={12} />
            <span>100% Secure & Private</span>
          </div>
        </div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;