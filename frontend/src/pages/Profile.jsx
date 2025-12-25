import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, ShieldCheck, Edit3, Save } from "lucide-react";
import "../styles/Profile.css";

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [userData, setUserData] = useState({
    name: storedUser?.name || "User Name",
    email: storedUser?.email || "example@email.com",
    phone: storedUser?.phone || "",
    city: storedUser?.city || "",
    score: 87,
  });

  const [editing, setEditing] = useState(false);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setEditing(false);
    localStorage.setItem("user", JSON.stringify(userData));
    alert("✅ Profile updated successfully!");
  };

  useEffect(() => {
    document.title = "Profile | CyberSathi";
  }, []);

  return (
    <div className="profile-container">
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Profile Picture */}
        <div className="profile-avatar">
          <User size={60} className="avatar-icon" />
        </div>

        {/* User Info */}
        <h2 className="profile-name">{userData.name}</h2>
        <p className="profile-email">
          <Mail size={16} /> {userData.email}
        </p>

        <div className="profile-score">
          <ShieldCheck size={18} /> Safety Score:{" "}
          <b>{userData.score}%</b>
        </div>

        {/* Editable Fields */}
        <div className="profile-form">
          <div className="form-group">
            <Phone size={18} />
            <input
              type="text"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <MapPin size={18} />
            <input
              type="text"
              name="city"
              value={userData.city}
              onChange={handleChange}
              placeholder="City / Location"
              disabled={!editing}
            />
          </div>

          <div className="button-group">
            {!editing ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Edit
              </button>
            ) : (
              <button className="btn-save" onClick={handleSave}>
                <Save size={16} /> Save
              </button>
            )}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="profile-footer">
          <p>
            💜 “Your safety is your superpower. Stay alert, stay confident, stay
            empowered with <b>CyberSathi</b>.”
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
