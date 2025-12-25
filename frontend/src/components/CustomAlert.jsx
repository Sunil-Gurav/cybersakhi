import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, Mic } from "lucide-react";
import "../styles/CustomAlert.css";

const CustomAlert = ({ isOpen, onClose, type = "info", title, message, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={24} />;
      case "error":
        return <AlertTriangle size={24} />;
      case "warning":
        return <AlertTriangle size={24} />;
      case "voice":
        return <Mic size={24} />;
      default:
        return <Info size={24} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "alert-success";
      case "error":
        return "alert-error";
      case "warning":
        return "alert-warning";
      case "voice":
        return "alert-voice";
      default:
        return "alert-info";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="custom-alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`custom-alert ${getTypeClass()}`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="alert-icon">
              {getIcon()}
            </div>
            <div className="alert-content">
              {title && <h4 className="alert-title">{title}</h4>}
              <p className="alert-message">{message}</p>
            </div>
            <button className="alert-close" onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}>
              <X size={18} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easy alert management
export const useCustomAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (type, title, message, duration = 5000) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const closeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const AlertContainer = () => (
    <>
      {alerts.map(alert => (
        <CustomAlert
          key={alert.id}
          isOpen={true}
          onClose={() => closeAlert(alert.id)}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          duration={alert.duration}
        />
      ))}
    </>
  );

  return { showAlert, AlertContainer };
};

export default CustomAlert;
