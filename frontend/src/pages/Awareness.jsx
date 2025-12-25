import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Wifi, Smartphone, Eye } from "lucide-react";
import "../styles//awareness.css";

const tips = [
  {
    icon: <ShieldCheck size={26} className="text-purple-600" />,
    title: "Use Strong Passwords",
    desc: "Create passwords with uppercase, lowercase, numbers, and special symbols. Never reuse old passwords.",
  },
  {
    icon: <Lock size={26} className="text-purple-600" />,
    title: "Enable Two-Factor Authentication",
    desc: "Add an extra layer of protection to your accounts by enabling 2FA wherever possible.",
  },
  {
    icon: <Wifi size={26} className="text-purple-600" />,
    title: "Avoid Public Wi-Fi for Transactions",
    desc: "Never enter banking details or sensitive data while connected to public Wi-Fi networks.",
  },
  {
    icon: <Smartphone size={26} className="text-purple-600" />,
    title: "Verify Links Before Clicking",
    desc: "Avoid clicking on suspicious links in emails or messages — they may lead to phishing sites.",
  },
  {
    icon: <Eye size={26} className="text-purple-600" />,
    title: "Be Aware of Online Harassment",
    desc: "Report any abusive or threatening messages to authorities and block such users immediately.",
  },
];

const Awareness = () => {
  return (
    <div className="awareness-container">
      {/* Header Section */}
      <motion.div
        className="awareness-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="awareness-title">Cyber Awareness 💻</h1>
        <p className="awareness-subtitle">
          Stay informed and safe while navigating the digital world. Empower yourself with knowledge.
        </p>
      </motion.div>

      {/* Awareness Cards */}
      <motion.div
        className="awareness-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            className="awareness-card"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="tip-icon">{tip.icon}</div>
            <h3 className="tip-title">{tip.title}</h3>
            <p className="tip-desc">{tip.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="awareness-cta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="cta-heading">Stay Alert, Stay Secure 🔐</h2>
        <p className="cta-desc">
          CyberSathi helps you learn, protect, and grow safely in the digital world.
        </p>
        <button className="cta-button">Learn More</button>
      </motion.div>
    </div>
  );
};

export default Awareness;
