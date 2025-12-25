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
            
            // Wait for connection to be fully ready
            const mongoose = await import('mongoose');
            let attempts = 0;
            while (mongoose.default.connection.readyState !== 1 && attempts < 30) {
                console.log(`⏳ Waiting for connection to be ready... (${attempts + 1}/30)`);
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            
            if (mongoose.default.connection.readyState !== 1) {
                throw new Error('Connection timeout - database not ready');
            }
            
            console.log("✅ MongoDB connection is ready");
        } catch (error) {
            console.error("❌ MongoDB initialization failed:", error.message);
            dbConnection = null;
            throw error; // Re-throw to let caller handle
        }
    }
    return dbConnection;
};

// Middleware to ensure DB connection before each request
const ensureDBConnection = async (req, res, next) => {
    try {
        console.log('🔍 Middleware - Checking DB connection...');
        
        // Always try to initialize/check connection
        await initializeDB();
        
        // Check if connection is ready
        const mongoose = await import('mongoose');
        const connectionState = mongoose.default.connection.readyState;
        
        console.log('🔍 Middleware - Connection state:', connectionState);
        
        if (connectionState !== 1) {
            console.log('⚠️ Middleware - Connection not ready, attempting reconnect...');
            
            // Reset cached connection and try again
            dbConnection = null;
            await initializeDB();
            
            // Check again
            if (mongoose.default.connection.readyState !== 1) {
                throw new Error('Unable to establish database connection');
            }
        }
        
        // Wait a moment to ensure connection is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Middleware - DB connection verified');
        next();
    } catch (error) {
        console.error("❌ Database connection middleware error:", error);
        return res.status(503).json({
            message: "Database connection unavailable",
            error: error.message,
            timestamp: new Date().toISOString()
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
        console.log('🔍 DB Test - Starting database connection test...');
        
        // For this test, we'll use a different approach to avoid buffering issues
        const mongoose = await import('mongoose');
        
        // Check current connection state
        let connectionState = mongoose.default.connection.readyState;
        console.log('🔍 DB Test - Initial connection state:', connectionState);
        
        // If not connected, try to connect
        if (connectionState !== 1) {
            console.log('🔄 DB Test - Attempting to establish connection...');
            try {
                await initializeDB();
                connectionState = mongoose.default.connection.readyState;
                console.log('🔍 DB Test - Connection state after init:', connectionState);
            } catch (initError) {
                console.error('❌ DB Test - Connection initialization failed:', initError.message);
                throw initError;
            }
        }
        
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        if (connectionState !== 1) {
            throw new Error(`Database not connected. State: ${states[connectionState]}`);
        }
        
        // Test basic connection info without running queries that might fail with buffering
        const connectionInfo = {
            status: "Database connection successful",
            connectionState: states[connectionState],
            timestamp: new Date().toISOString(),
            mongoUri: process.env.MONGO_URI ? 'Set' : 'Missing',
            host: mongoose.default.connection.host || 'Unknown',
            dbName: mongoose.default.connection.name || 'Unknown',
            readyState: connectionState
        };
        
        // Try to get user count, but don't fail the test if it doesn't work
        try {
            // Import User model
            const { default: User } = await import('../models/User.js');
            
            // Wait a bit more to ensure connection is stable
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const userCount = await User.countDocuments();
            connectionInfo.userCount = userCount;
            console.log('✅ DB Test - User count query successful:', userCount);
        } catch (queryError) {
            console.log('⚠️ DB Test - Query failed (connection still valid):', queryError.message);
            connectionInfo.userCount = 'Query failed - ' + queryError.message;
            connectionInfo.note = 'Connection is valid but query failed (possibly due to buffering settings)';
        }
        
        res.json(connectionInfo);
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