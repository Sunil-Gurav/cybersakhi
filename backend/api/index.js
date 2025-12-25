// backend/api/index.js - Vercel Serverless Function Entry Point
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables first
dotenv.config();

console.log('🔍 Environment variables status:');
console.log('🔍 MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Missing');
console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
console.log('🔍 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Missing');

// Import after dotenv config
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

// Create Express app
const app = express();

// Initialize MongoDB connection
let dbConnection = null;

// Connect to MongoDB with proper error handling for serverless
const initializeDB = async () => {
    if (!dbConnection) {
        try {
            console.log("🔄 Initializing MongoDB connection...");
            dbConnection = await connectDB();
            console.log("📊 MongoDB initialized successfully in serverless function");
        } catch (error) {
            console.error("❌ MongoDB initialization failed:", error.message);
            dbConnection = null;
            // Don't throw here - let individual requests handle the connection
        }
    }
    return dbConnection;
};

// Middleware to ensure DB connection before each request
const ensureDBConnection = async (req, res, next) => {
    try {
        if (!dbConnection) {
            console.log("🔄 No cached connection, attempting to connect...");
            await initializeDB();
        }
        
        // Check if connection is still alive
        const mongoose = await import('mongoose');
        if (mongoose.default.connection.readyState !== 1) {
            console.log("⚠️ Connection not ready, reconnecting...");
            dbConnection = null;
            await initializeDB();
        }
        
        if (!dbConnection) {
            return res.status(503).json({
                message: "Database connection unavailable",
                error: "Unable to connect to MongoDB"
            });
        }
        
        next();
    } catch (error) {
        console.error("❌ Database connection middleware error:", error);
        return res.status(503).json({
            message: "Database connection error",
            error: error.message
        });
    }
};

// Initialize DB connection on startup
initializeDB();

// CORS Configuration - More permissive for debugging
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ CORS allowed - No origin (mobile/curl)');
            return callback(null, true);
        }
        
        console.log('🔍 CORS Request from origin:', origin);
        
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:5173", // Vite dev server
            "http://localhost:4173", // Vite preview
            "https://cybersakhi.vercel.app",
            "https://cybersakhi-frontend.vercel.app",
            "https://cybersakhi-121w.vercel.app", // Current frontend deployment
            "https://cybersakhi-frontend-git-main-sunil-guravs-projects.vercel.app",
            process.env.FRONTEND_URL
        ].filter(Boolean);
        
        // Allow all Vercel preview deployments and cybersakhi domains
        if (origin.includes('.vercel.app') && 
            (origin.includes('cybersakhi') || origin.includes('sunil-gurav'))) {
            console.log('✅ CORS allowed - Vercel cybersakhi domain:', origin);
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ CORS allowed - Specific origin:', origin);
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked origin:', origin);
            console.log('� AlRlowed origins:', allowedOrigins);
            callback(null, true); // Allow all for debugging - remove in production
        }
    },
    credentials: false, // Disable credentials for CORS simplicity
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "x-auth-token",
        "x-ai-api-key",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Allow-Origin"
    ],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Explicit OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));

// Additional CORS middleware for extra safety
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow cybersakhi domains
    if (origin && origin.includes('cybersakhi') && origin.includes('.vercel.app')) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-ai-api-key, Accept, Origin, X-Requested-With');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('🔄 Handling OPTIONS preflight for:', req.headers.origin);
        return res.status(200).end();
    }
    
    next();
});

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

// Database connection test endpoint
app.get("/db-test", async (req, res) => {
    try {
        const mongoose = await import('mongoose');
        const connectionState = mongoose.default.connection.readyState;
        
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        // Try to connect if not connected
        if (connectionState !== 1) {
            console.log('🔄 DB Test - Attempting connection...');
            await initializeDB();
        }
        
        // Test a simple query
        const User = mongoose.default.model('User') || (await import('../models/User.js')).default;
        const userCount = await User.countDocuments();
        
        res.json({
            status: "Database connection successful",
            connectionState: states[mongoose.default.connection.readyState],
            userCount,
            timestamp: new Date().toISOString(),
            mongoUri: process.env.MONGO_URI ? 'Set' : 'Missing',
            host: mongoose.default.connection.host
        });
    } catch (error) {
        console.error('❌ DB Test Error:', error);
        res.status(500).json({
            status: "Database connection failed",
            error: error.message,
            timestamp: new Date().toISOString(),
            mongoUri: process.env.MONGO_URI ? 'Set' : 'Missing'
        });
    }
});

// API Routes - Add DB connection middleware to all routes
app.use("/auth", ensureDBConnection, authRoutes);
app.use("/ai", ensureDBConnection, aiRoutes);
app.use("/sos", ensureDBConnection, sosRoutes);
app.use("/assistant", ensureDBConnection, assistantRoutes);
app.use("/user-data", ensureDBConnection, userDataRoutes);
app.use("/crime-analysis", ensureDBConnection, crimeAnalysisRoutes);
app.use("/ai/location", ensureDBConnection, locationAnalysisRoutes);
app.use("/activities", ensureDBConnection, userActivityRoutes);
app.use("/family", ensureDBConnection, familyRoutes);

// Test endpoint without DB dependency
app.get("/test", (req, res) => {
    res.json({
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            mongoUri: process.env.MONGO_URI ? 'Set' : 'Missing',
            jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
            emailUser: process.env.EMAIL_USER ? 'Set' : 'Missing',
            emailPass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
        }
    });
});

// Error handling middleware - Improved for production
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    
    // Don't leak error details in production
    const errorResponse = {
        message: "Internal server error",
        status: "error",
        timestamp: new Date().toISOString()
    };
    
    // Add error details only in development
    if (process.env.NODE_ENV !== "production") {
        errorResponse.error = err.message;
        errorResponse.stack = err.stack;
    }
    
    res.status(500).json(errorResponse);
});

// 404 handler - Fixed for Express 5.x compatibility
app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableRoutes: [
            "/auth/*",
            "/ai/*", 
            "/sos/*",
            "/assistant/*",
            "/user-data/*",
            "/crime-analysis/*",
            "/activities/*",
            "/family/*"
        ]
    });
});

// For Vercel serverless functions
export default app;