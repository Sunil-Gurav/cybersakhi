import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Shield, Send, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import api from "../api/apiclient";
import "../styles/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sakhi",
  });
  const [otpData, setOtpData] = useState({
    otp: "",
    email: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setOtpData({ ...otpData, otp: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post("/auth/send-otp", formData);
      
      if (res.data.otpSent) {
        setOtpData({ ...otpData, email: formData.email });
        setStep(2);
        alert("🎉 " + res.data.msg);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "⚠️ Failed to send OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    
    try {
      const res = await api.post("/auth/verify-otp", {
        email: otpData.email,
        otp: otpData.otp
      });
      
      if (res.data.token) {
        // Store user data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        alert("🎉 " + res.data.msg);
        
        // Redirect based on role
        if (res.data.user.role === "family") {
          navigate("/family-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "⚠️ Invalid OTP!");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    
    try {
      const res = await api.post("/auth/resend-otp", {
        email: otpData.email
      });
      
      alert("📧 " + res.data.msg);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "⚠️ Failed to resend OTP!");
    } finally {
      setResendLoading(false);
    }
  };

  const goBackToForm = () => {
    setStep(1);
    setOtpData({ otp: "", email: "" });
  };

  return (
    <div className="register-container">
      <motion.div
        className="register-box"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="registration-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="register-header">
                <h1 className="register-title">Create Your Account 💜</h1>
                <p className="register-subtitle">
                  Join <span className="highlight">CyberSakhi</span> and protect
                  yourself or your loved ones online.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="register-form">
                <div className="input-group">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <Lock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="6"
                    required
                  />
                </div>

                <div className="input-group role-select">
                  <Shield className="input-icon" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="sakhi">🧍‍♀️ Sakhi (User)</option>
                    <option value="family">👨‍👩‍👧‍👦 Family Member</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  className="btn-register"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="spin" size={20} />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Verification Code
                    </>
                  )}
                </motion.button>
              </form>

              <p className="register-footer">
                Already have an account?{" "}
                <Link to="/login" className="login-link">
                  Login here
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="otp-verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="otp-header">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={goBackToForm}
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="register-title">Verify Your Email 📧</h1>
                <p className="register-subtitle">
                  We've sent a 6-digit verification code to<br />
                  <span className="highlight">{otpData.email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="otp-form">
                <div className="otp-input-group">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpData.otp}
                    onChange={handleOtpChange}
                    maxLength="6"
                    className="otp-input"
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  className="btn-verify"
                  disabled={otpLoading || otpData.otp.length !== 6}
                  whileHover={{ scale: (otpLoading || otpData.otp.length !== 6) ? 1 : 1.05 }}
                  whileTap={{ scale: (otpLoading || otpData.otp.length !== 6) ? 1 : 0.95 }}
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Verify & Complete Registration
                    </>
                  )}
                </motion.button>

                <div className="otp-actions">
                  <p className="otp-text">Didn't receive the code?</p>
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="spin" size={16} />
                        Resending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
