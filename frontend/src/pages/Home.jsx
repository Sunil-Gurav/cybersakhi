import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mic,
  AlertTriangle,
  MessageSquare,
  Brain,
  Scale,
  Globe,
  ShieldCheck,
  Lock,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Users,
  Navigation,
  Star,
  ArrowRight,
} from "lucide-react";
import "../styles/Home.css";

const features = [
  {
    icon: <Mic size={28} />,
    title: "Voice Command SOS",
    desc: "Trigger emergency alerts instantly using your voice commands in critical moments.",
    gradient: "from-purple-500 to-pink-500",
    delay: 0.1
  },
  {
    icon: <Globe size={28} />,
    title: "Real-Time Location",
    desc: "Share your accurate live location securely with trusted contacts during emergencies.",
    gradient: "from-blue-500 to-cyan-500",
    delay: 0.2
  },
  {
    icon: <Brain size={28} />,
    title: "AI Crime Predictor",
    desc: "Predict unsafe areas using AI models based on crime rate and geolocation data.",
    gradient: "from-green-500 to-emerald-500",
    delay: 0.3
  },
  {
    icon: <MessageSquare size={28} />,
    title: "24×7 AI Helpline",
    desc: "Get instant AI chat assistance anytime — for safety, guidance, or support.",
    gradient: "from-orange-500 to-red-500",
    delay: 0.4
  },
  {
    icon: <AlertTriangle size={28} />,
    title: "Emotion Detection",
    desc: "AI detects your emotions through voice & text tone for empathetic responses.",
    gradient: "from-yellow-500 to-amber-500",
    delay: 0.5
  },
  {
    icon: <Scale size={28} />,
    title: "Legal Guidance",
    desc: "Access verified IPC sections, laws, and women's legal rights in cyber cases.",
    gradient: "from-indigo-500 to-purple-500",
    delay: 0.6
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Cyber Awareness",
    desc: "Learn about safe online practices, phishing awareness, and cyber hygiene.",
    gradient: "from-teal-500 to-blue-500",
    delay: 0.7
  },
  {
    icon: <Lock size={28} />,
    title: "Data Privacy",
    desc: "Your data stays encrypted and private — we value your digital safety.",
    gradient: "from-gray-600 to-gray-800",
    delay: 0.8
  },
];

const stats = [
  { number: "24/7", label: "Active Protection", icon: <Shield size={20} /> },
  { number: "AI", label: "Powered Safety", icon: <Zap size={20} /> },
  { number: "100%", label: "Data Encrypted", icon: <Lock size={20} /> },
  { number: "1-Tap", label: "Emergency SOS", icon: <AlertTriangle size={20} /> },
];

const Home = () => {
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
        duration: 0.6
      }
    }
  };

  return (
    <div className="home-container">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
        <div className="floating-element element-4"></div>
      </div>

      {/* Hero Section */}
      <motion.section
        className="home-hero"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="hero-badge"
          variants={itemVariants}
        >
          <Sparkles size={16} />
          <span>AI-Powered Women's Safety Platform</span>
        </motion.div>

        <motion.h1
          className="home-title"
          variants={itemVariants}
        >
          Your Digital <span className="gradient-text">Safety Companion</span> 💜
        </motion.h1>

        <motion.p
          className="home-subtitle"
          variants={itemVariants}
        >
          CyberSathi combines cutting-edge AI technology with empathetic support to provide 
          real-time protection, emotional guidance, and comprehensive safety solutions for women.
        </motion.p>

        <motion.div
          className="home-buttons"
          variants={itemVariants}
        >
          <Link to="/register" className="btn-primary">
            <Zap size={20} />
            Get Started Free
            <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-outline">
            <Users size={20} />
            Existing User
          </Link>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="hero-stats"
          variants={itemVariants}
        >
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="features-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Why Choose CyberSathi?</h2>
          <p className="section-subtitle">
            Comprehensive safety features designed with cutting-edge technology and empathy
          </p>
        </motion.div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                transition: { type: "spring", stiffness: 300 }
              }}
              transition={{ 
                duration: 0.5, 
                delay: feature.delay,
                type: "spring",
                stiffness: 100
              }}
              viewport={{ once: true }}
            >
              <div className={`feature-icon-wrapper gradient-${index + 1}`}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
              <div className="feature-arrow">
                <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="cta-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="cta-container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">
              Ready to Feel <span className="gradient-text">Safe & Empowered</span>?
            </h2>
            <p className="cta-desc">
              Join thousands of women who trust CyberSathi for their digital safety. 
              Get real-time protection, AI guidance, and peace of mind.
            </p>
            <div className="cta-features">
              <div className="cta-feature">
                <Star size={18} />
                <span>24/7 AI Protection</span>
              </div>
              <div className="cta-feature">
                <Heart size={18} />
                <span>Emotional Support</span>
              </div>
              <div className="cta-feature">
                <Navigation size={18} />
                <span>Real-time Tracking</span>
              </div>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary">
                <Shield size={20} />
                Start Your Safety Journey
                <ArrowRight size={16} />
              </Link>
              <Link to="/awareness" className="btn-cta-secondary">
                Learn More About Safety
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="cta-visual"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="visual-element">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
              <div className="safety-shield">
                <ShieldCheck size={48} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Badge */}
      <motion.div
        className="trust-badge"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <div className="trust-content">
          <Lock size={20} />
          <span>Your data is 100% encrypted and secure</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;