// backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async(req, res, next) => {
    try {
        let token;

        // Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // No token case
        if (!token) {
            return res.status(401).json({
                msg: "No token provided. Authorization denied.",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ msg: "User not found. Unauthorized." });
        }

        req.user = user; // Attach to req

        next(); // Move to next middleware

    } catch (err) {
        console.error("Auth Error:", err.message);
        res.status(401).json({ msg: "Invalid or expired token" });
    }
};