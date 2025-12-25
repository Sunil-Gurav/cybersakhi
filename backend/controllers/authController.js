// backend/controllers/authController.js
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTPEmail, sendWelcomeEmail, sendPasswordResetOTP, sendPasswordResetConfirmation } from "../utils/emailService.js";

/* SEND OTP FOR REGISTRATION */
export const sendRegistrationOTP = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "All fields are required!" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isEmailVerified) {
            return res.status(400).json({ msg: "Email already registered and verified!" });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create or update user with OTP
        let user;
        if (existingUser) {
            // Update existing unverified user
            user = await User.findOneAndUpdate(
                { email },
                {
                    name,
                    password: hashedPassword,
                    role,
                    emailOTP: otp,
                    otpExpires,
                    isEmailVerified: false
                },
                { new: true }
            );
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role,
                emailOTP: otp,
                otpExpires,
                isEmailVerified: false,
                familyMembers: [],
            });
        }

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, name);
        
        if (!emailResult.success) {
            return res.status(500).json({ 
                msg: "Failed to send OTP email. Please try again.",
                error: emailResult.error 
            });
        }

        res.json({
            msg: "OTP sent successfully! Please check your email.",
            userId: user._id,
            email: user.email,
            otpSent: true
        });

    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* VERIFY OTP AND COMPLETE REGISTRATION */
export const verifyOTPAndRegister = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ msg: "Email and OTP are required!" });
        }

        // Find user with matching email and OTP
        const user = await User.findOne({ 
            email, 
            emailOTP: otp,
            otpExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP!" });
        }

        // Verify email and clear OTP fields
        user.isEmailVerified = true;
        user.emailOTP = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Send welcome email
        await sendWelcomeEmail(user.email, user.name, user.role);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            msg: "Registration completed successfully! 🎉",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                familyMembers: user.familyMembers,
                isEmailVerified: user.isEmailVerified
            },
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* RESEND OTP */
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: "Email is required!" });
        }

        // Find unverified user
        const user = await User.findOne({ email, isEmailVerified: false });
        if (!user) {
            return res.status(400).json({ msg: "User not found or already verified!" });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with new OTP
        user.emailOTP = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, user.name);
        
        if (!emailResult.success) {
            return res.status(500).json({ 
                msg: "Failed to resend OTP email. Please try again.",
                error: emailResult.error 
            });
        }

        res.json({
            msg: "OTP resent successfully! Please check your email.",
            otpSent: true
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* FORGOT PASSWORD - SEND OTP */
export const forgotPasswordSendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: "Email is required!" });
        }

        // Find user by email
        const user = await User.findOne({ email, isEmailVerified: true });
        if (!user) {
            return res.status(400).json({ msg: "No account found with this email address!" });
        }

        // Generate OTP for password reset
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in user document
        user.passwordResetOTP = otp;
        user.passwordResetExpires = otpExpires;
        await user.save();

        // Send password reset OTP email
        const emailResult = await sendPasswordResetOTP(email, otp, user.name);
        
        if (!emailResult.success) {
            return res.status(500).json({ 
                msg: "Failed to send password reset email. Please try again.",
                error: emailResult.error 
            });
        }

        res.json({
            msg: "Password reset OTP sent successfully! Please check your email.",
            otpSent: true
        });

    } catch (error) {
        console.error("Forgot password OTP error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* VERIFY PASSWORD RESET OTP */
export const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ msg: "Email and OTP are required!" });
        }

        // Find user with matching email and OTP
        const user = await User.findOne({ 
            email, 
            passwordResetOTP: otp,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP!" });
        }

        res.json({
            msg: "OTP verified successfully! You can now reset your password.",
            otpVerified: true,
            resetToken: user._id // Send user ID as reset token
        });

    } catch (error) {
        console.error("Verify password reset OTP error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ msg: "Email, OTP, and new password are required!" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters long!" });
        }

        // Find user with valid OTP
        const user = await User.findOne({ 
            email, 
            passwordResetOTP: otp,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired OTP!" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.passwordResetOTP = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Send password reset confirmation email
        await sendPasswordResetConfirmation(user.email, user.name);

        res.json({
            msg: "Password reset successfully! You can now login with your new password.",
            passwordReset: true
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* REGISTER (LEGACY - keeping for backward compatibility) */
export const registerUser = async(req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "All fields are required!" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "Email already exists!" });

        const hashed = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashed,
            role,
            familyMembers: [],
            isEmailVerified: true, // Legacy registration - auto verify
        });

        res.json({
            msg: "Registered successfully!",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({ msg: "Server Error" });
    }
};

/* LOGIN */
export const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ msg: "Email & Password required!" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Email!" });

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(400).json({ 
                msg: "Please verify your email before logging in!",
                emailNotVerified: true,
                email: user.email
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: "Incorrect Password!" });

        const token = jwt.sign({ id: user._id, role: user.role },
            process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            msg: "Login Successful",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                familyMembers: user.familyMembers,
                isEmailVerified: user.isEmailVerified
            },
        });
    } catch (error) {
        res.status(500).json({ msg: "Server Error" });
    }
};

/* VERIFY FAMILY EMAIL */
export const verifyFamilyEmail = async(req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ msg: "Email not found!" });
        if (user.role !== "family")
            return res.status(403).json({ msg: "Not a family user!" });

        return res.json({
            msg: "Family Verified",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ msg: "Server Error" });
    }
};

/* ADD FAMILY MEMBER */
export const addFamilyMember = async(req, res) => {
    try {
        const { familyEmail, userId } = req.body;
        
        // Get userId from authenticated user or request body
        const actualUserId = req.user?._id || userId;
        
        console.log("🔍 Add Family - userId:", actualUserId);
        console.log("🔍 Add Family - familyEmail:", familyEmail);
        console.log("🔍 Add Family - req.user:", req.user);

        if (!actualUserId) {
            return res.status(400).json({ msg: "User ID is required" });
        }

        const familyUser = await User.findOne({ email: familyEmail });
        if (!familyUser || familyUser.role !== "family")
            return res.status(400).json({ msg: "Invalid family email!" });

        const sakhi = await User.findById(actualUserId);
        if (!sakhi) {
            return res.status(404).json({ msg: "Sakhi user not found!" });
        }

        const already = sakhi.familyMembers.some(f => f.email === familyEmail);
        if (already) return res.status(400).json({ msg: "Already added!" });

        sakhi.familyMembers.push({
            name: familyUser.name,
            email: familyEmail,
            relation: "family",
        });

        await sakhi.save();

        res.json({
            msg: "Family Added",
            familyMembers: sakhi.familyMembers,
        });
    } catch (error) {
        console.error("Add family member error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};

/* GET SAKHI USERS FOR THIS FAMILY USER */
export const getSakhiUsers = async(req, res) => {
    try {
        // Get family email from authenticated user or query parameter
        const familyEmail = req.user?.email || req.query.familyEmail;
        
        console.log("🔍 Get Sakhi Users - familyEmail:", familyEmail);
        console.log("🔍 Get Sakhi Users - req.user:", req.user);

        if (!familyEmail) {
            return res.status(400).json({ msg: "Family email is required" });
        }

        const sakhiUsers = await User.find({
            role: "sakhi",
            "familyMembers.email": familyEmail,
        }).select("name email");

        console.log("🔍 Found sakhi users:", sakhiUsers);

        res.json({ sakhiUsers });
    } catch (error) {
        console.error("Get sakhi users error:", error);
        res.status(500).json({ msg: "Server Error" });
    }
};