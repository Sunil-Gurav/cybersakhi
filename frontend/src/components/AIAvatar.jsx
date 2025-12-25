import React from "react";
import "../styles/AIAvatar.css";

/**
 * Props:
 *  - speaking: boolean
 *  - size: number (px) optional
 *  - label: string (aria-label) optional
 */
const AIAvatar = ({ speaking = false, size = 180, label = "CyberSathi avatar" }) => {
  return (
    <div
      className={`cs-avatar ${speaking ? "cs-speaking" : ""}`}
      style={{ width: size, height: size }}
      aria-label={label}
      role="img"
    >
      {/* Head circle */}
      <div className="cs-head">
        {/* Hair */}
        <div className="cs-hair"></div>

        {/* Face */}
        <div className="cs-face">
          {/* Eyes */}
          <div className="cs-eye cs-eye-left"></div>
          <div className="cs-eye cs-eye-right"></div>

          {/* Cheeks */}
          <div className="cs-cheek cs-cheek-left"></div>
          <div className="cs-cheek cs-cheek-right"></div>

          {/* Mouth (animated on speaking) */}
          <div className="cs-mouth"></div>
        </div>

        {/* Shoulders */}
        <div className="cs-shoulders"></div>
      </div>

      {/* Glow ring */}
      <div className="cs-glow"></div>
    </div>
  );
};

export default AIAvatar;
