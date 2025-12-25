import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, X, Send, CheckCircle, RefreshCw, ArrowLeft, Key } from "lucide-react";
import api from "../api/apiclient";
import "../styles/Login.css";

const Login = () => {
  const [values, setValues] = useState({ email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp') {
      // Only allow digits and max 6 characters
      const otpValue = value.replace(/\D/g, '').slice(0, 6);
      setForgotData({ ...forgotData, [name]: otpValue });
    } else {
      setForgotData({ ...forgotData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.email || !values.password) return alert("Email & Password required");

    try {
      console.log("Frontend: sending login body:", values);
      const res = await api.post("/auth/login", values);
      console.log("Frontend: login response:", res.data);

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Dispatch custom event to update App state
      window.dispatchEvent(new Event("userLogin"));

      alert(`Welcome back, ${user.name}`);
      await new Promise((r) => setTimeout(r, 100));
      navigate(user.role === "family" ? "/fam-dashboard" : "/dashboard");
    } catch (err) {
      console.error("❌ Login Error:", err);
      const msg = err.response?.data?.msg || "Server error or invalid credentials";
      alert(msg);
    }
  };

  // 🔹 NEW: Forgot Password Functions
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (forgotStep === 1) {
      // Send OTP
      if (!forgotData.email.trim()) {
        alert("Please enter your email address");
        return;
      }

      setLoading(true);
      try {
        const res = await api.post("/auth/forgot-password", {
          email: forgotData.email.trim()
        });
        
        alert("🎉 " + res.data.msg);
        setForgotStep(2);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "⚠️ Failed to send reset email!");
      } finally {
        setLoading(false);
      }
    } else if (forgotStep === 2) {
      // Verify OTP
      if (!forgotData.otp || forgotData.otp.length !== 6) {
        alert("Please enter the 6-digit OTP");
        return;
      }

      setOtpLoading(true);
      try {
        const res = await api.post("/auth/verify-reset-otp", {
          email: forgotData.email,
          otp: forgotData.otp
        });
        
        alert("✅ " + res.data.msg);
        setForgotStep(3);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "⚠️ Invalid OTP!");
      } finally {
        setOtpLoading(false);
      }
    } else if (forgotStep === 3) {
      // Reset Password
      if (!forgotData.newPassword || forgotData.newPassword.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }

      if (forgotData.newPassword !== forgotData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      setResetLoading(true);
      try {
        const res = await api.post("/auth/reset-password", {
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.newPassword
        });
        
        alert("🎉 " + res.data.msg);
        closeForgotPassword();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "⚠️ Failed to reset password!");
      } finally {
        setResetLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: forgotData.email
      });
      
      alert("📧 " + res.data.msg);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "⚠️ Failed to resend OTP!");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const goBackStep = () => {
    if (forgotStep > 1) {
      setForgotStep(forgotStep - 1);
    }
  };

  return (
    <>
      <div className="auth-wrap">
        <motion.div className="auth-box" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="auth-title">Welcome Back 💜</h1>
          <p className="auth-sub">Sign in to <b>CyberSathi</b> and stay secure online.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="in-grp">
              <Mail className="in-ico" />
              <input type="email" name="email" placeholder="Email" value={values.email} onChange={handleChange} required />
            </div>

            <div className="in-grp">
              <Lock className="in-ico" />
              <input type="password" name="password" placeholder="Password" value={values.password} onChange={handleChange} required />
            </div>

            <motion.button whileHover={{ scale: 1.03 }} className="btn-auth" type="submit">Login</motion.button>
          </form>

          {/* 🔹 NEW: Forgot Password Link */}
          <div className="auth-links">
            <button 
              type="button" 
              className="forgot-password-link"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </div>

          <p className="auth-foot">New here? <Link to="/register">Create Account</Link></p>
        </motion.div>
      </div>

      {/* 🔹 NEW: Forgot Password Popup */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            className="forgot-password-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="forgot-password-popup"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="popup-header">
                <div className="header-content">
                  {forgotStep > 1 && (
                    <button className="back-btn" onClick={goBackStep}>
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div className="header-text">
                    <h2>
                      {forgotStep === 1 && "🔐 Reset Password"}
                      {forgotStep === 2 && "📧 Verify Email"}
                      {forgotStep === 3 && "🔑 New Password"}
                    </h2>
                    <p>
                      {forgotStep === 1 && "Enter your email to receive a reset code"}
                      {forgotStep === 2 && `Enter the 6-digit code sent to ${forgotData.email}`}
                      {forgotStep === 3 && "Create a new secure password"}
                    </p>
                  </div>
                </div>
                <button className="close-btn" onClick={closeForgotPassword}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="forgot-form">
                {forgotStep === 1 && (
                  <div className="form-step">
                    <div className="input-group">
                      <Mail className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={forgotData.email}
                        onChange={handleForgotChange}
                        required
                      />
                    </div>
                    
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="spin" size={20} />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          Send Reset Code
                        </>
                      )}
                    </motion.button>
                  </div>
                )}

                {forgotStep === 2 && (
                  <div className="form-step">
                    <div className="otp-input-group">
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit code"
                        value={forgotData.otp}
                        onChange={handleForgotChange}
                        maxLength="6"
                        className="otp-input"
                        required
                      />
                    </div>
                    
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      disabled={otpLoading || forgotData.otp.length !== 6}
                      whileHover={{ scale: (otpLoading || forgotData.otp.length !== 6) ? 1 : 1.02 }}
                      whileTap={{ scale: (otpLoading || forgotData.otp.length !== 6) ? 1 : 0.98 }}
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="spin" size={20} />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Verify Code
                        </>
                      )}
                    </motion.button>

                    <div className="otp-actions">
                      <p className="otp-text">Didn't receive the code?</p>
                      <button
                        type="button"
                        className="resend-btn"
                        onClick={handleResendOTP}
                        disabled={otpLoading}
                      >
                        {otpLoading ? (
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
                  </div>
                )}

                {forgotStep === 3 && (
                  <div className="form-step">
                    <div className="input-group">
                      <Key className="input-icon" />
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="New password (min 6 characters)"
                        value={forgotData.newPassword}
                        onChange={handleForgotChange}
                        minLength="6"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <Lock className="input-icon" />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        value={forgotData.confirmPassword}
                        onChange={handleForgotChange}
                        minLength="6"
                        required
                      />
                    </div>
                    
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      disabled={resetLoading}
                      whileHover={{ scale: resetLoading ? 1 : 1.02 }}
                      whileTap={{ scale: resetLoading ? 1 : 0.98 }}
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="spin" size={20} />
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Reset Password
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Login;
