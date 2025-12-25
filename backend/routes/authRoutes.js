// backend/routes/authRoutes.js
import express from "express";
import {
    registerUser,
    loginUser,
    verifyFamilyEmail,
    addFamilyMember,
    getSakhiUsers,
    sendRegistrationOTP,
    verifyOTPAndRegister,
    resendOTP,
    forgotPasswordSendOTP,
    verifyPasswordResetOTP,
    resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC ROUTES
router.post("/register", registerUser); // Legacy route
router.post("/send-otp", sendRegistrationOTP); // 🔹 NEW: Send OTP for registration
router.post("/verify-otp", verifyOTPAndRegister); // 🔹 NEW: Verify OTP and complete registration
router.post("/resend-otp", resendOTP); // 🔹 NEW: Resend OTP
router.post("/forgot-password", forgotPasswordSendOTP); // 🔹 NEW: Send password reset OTP
router.post("/verify-reset-otp", verifyPasswordResetOTP); // 🔹 NEW: Verify password reset OTP
router.post("/reset-password", resetPassword); // 🔹 NEW: Reset password
router.post("/login", loginUser);
router.post("/verify-family", verifyFamilyEmail);

// TEMPORARY: Unprotected route for testing
router.post("/add-family-test", addFamilyMember);
router.get("/sakhi-users-test", getSakhiUsers);

// PROTECTED ROUTES
router.post("/add-family", protect, addFamilyMember);
router.get("/sakhi-users", protect, getSakhiUsers);

export default router;