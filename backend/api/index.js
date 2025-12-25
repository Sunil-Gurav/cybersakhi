// backend/api/index.js - Vercel Serverless Function Entry Point
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";
import aiRoutes from "../routes/aiRoutes.js";
import sosRoutes from "../routes/sosRoutes.js";
import assistantRoutes from "../routes/assistantRoutes.js";
import userDataRoutes from "../routes/userDataRoutes.js";
import crimeAnalysisRoutes from "../routes/crimeAnalysisRoutes.js";
import locationAnalysisRoutes from "../routes/ai/location-analysis.js";
import userActivityRoutes from "../routes/userActivityRoutes.js";
import familyRoutes from "../routes/familyRoutes.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://cybersakhi.vercel.app",
        "https://cybersakhi-frontend.vercel.app",
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        message: "🛡️ CyberSakhi Backend API is running!",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);
app.use("/sos", sosRoutes);
app.use("/assistant", assistantRoutes);
app.use("/user-data", userDataRoutes);
app.use("/crime-analysis", crimeAnalysisRoutes);
app.use("/ai/location", locationAnalysisRoutes);
app.use("/activities", userActivityRoutes);
app.use("/family", familyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "production" ? {} : err.message
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        message: "Route not found",
        path: req.originalUrl
    });
});

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;
    
    // Create HTTP server for Socket.IO
    const server = http.createServer(app);
    
    // Socket.IO setup
    const io = new Server(server, {
        cors: corsOptions
    });
    
    // Store io instance in app for access in routes
    app.set("io", io);
    
    // Socket.IO connection handling
    io.on("connection", (socket) => {
        console.log("👤 User connected:", socket.id);
        
        socket.on("disconnect", () => {
            console.log("👋 User disconnected:", socket.id);
        });
    });
    
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.IO enabled`);
    });
}