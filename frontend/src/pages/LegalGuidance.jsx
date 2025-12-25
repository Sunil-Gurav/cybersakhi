import React from "react";
import { motion } from "framer-motion";
import { Scale, Shield, Phone, Globe, BookOpen } from "lucide-react";
import "../styles/LegalGuidance.css";

const legalRights = [
  {
    icon: <Scale size={26} className="text-purple-600" />,
    title: "Cyber Crime Laws in India",
    desc: "Cybercrimes in India are governed under the Information Technology Act, 2000 and the Indian Penal Code (IPC). They cover crimes like hacking, stalking, phishing, identity theft, and online harassment.",
  },
  {
    icon: <Shield size={26} className="text-purple-600" />,
    title: "Section 66E - IT Act",
    desc: "Protects individuals against violation of privacy. Capturing, publishing, or transmitting private images without consent is punishable by imprisonment up to 3 years or a fine up to ₹2 lakh.",
  },
  {
    icon: <BookOpen size={26} className="text-purple-600" />,
    title: "Section 354D - IPC (Stalking)",
    desc: "If a man follows or contacts a woman repeatedly to foster personal interaction despite her disinterest, he is liable for stalking. Punishment includes imprisonment up to 3 years.",
  },
  {
    icon: <Scale size={26} className="text-purple-600" />,
    title: "Section 509 - IPC (Insulting Modesty)",
    desc: "Whoever insults the modesty of a woman by words, gestures, or acts intended to outrage her modesty shall be punished with simple imprisonment up to 3 years and a fine.",
  },
  {
    icon: <Shield size={26} className="text-purple-600" />,
    title: "Section 67 - IT Act (Obscene Content)",
    desc: "Publishing or transmitting obscene material electronically is punishable with imprisonment up to 3 years and a fine up to ₹5 lakh for first conviction.",
  },
];

const helplines = [
  {
    title: "National Cyber Crime Reporting Portal",
    desc: "Report cybercrimes online directly through the official government portal.",
    link: "https://cybercrime.gov.in/",
  },
  {
    title: "Women Helpline Number (All India)",
    desc: "Dial the national women’s helpline number for immediate legal or emotional support.",
    contact: "1091",
  },
  {
    title: "Cyber Cell Contact (Police)",
    desc: "Visit your nearest cyber cell office or call your city’s cyber helpline for assistance.",
    contact: "155260",
  },
];

const LegalGuidance = () => {
  return (
    <div className="legal-container">
      {/* Header Section */}
      <motion.div
        className="legal-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="legal-title">Legal Guidance ⚖️</h1>
        <p className="legal-subtitle">
          Learn about women’s legal rights, cyber laws, and helplines for protection and justice.
        </p>
      </motion.div>

      {/* Laws & Sections */}
      <motion.div
        className="legal-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        {legalRights.map((item, index) => (
          <motion.div
            key={index}
            className="legal-card"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="legal-icon">{item.icon}</div>
            <h3 className="legal-card-title">{item.title}</h3>
            <p className="legal-card-desc">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Helpline Section */}
      <motion.div
        className="helpline-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="helpline-title">Important Helplines ☎️</h2>
        <div className="helpline-grid">
          {helplines.map((item, index) => (
            <motion.div
              key={index}
              className="helpline-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Phone size={24} className="text-purple-600 mb-2" />
              <h4 className="helpline-name">{item.title}</h4>
              <p className="helpline-desc">{item.desc}</p>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="helpline-link"
                >
                  Visit Portal
                </a>
              )}
              {item.contact && (
                <p className="helpline-contact">
                  📞 <strong>{item.contact}</strong>
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer Message */}
      <motion.div
        className="legal-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>
          💜 CyberSathi aims to empower every woman with knowledge of her rights and access to justice.
        </p>
      </motion.div>
    </div>
  );
};

export default LegalGuidance;
