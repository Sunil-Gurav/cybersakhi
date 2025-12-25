// backend/api/index.js - Vercel Serverless Function Entry Point
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables first
dotenv.config();

// Temporary hardcoded env vars for Vercel debugging
if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb+srv://habitspark01_db_user:sakhisathi9482411050@cluster0.3nbnlgf.mongodb.net/cybersakhi';
}
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your_jwt_secret_here_cybersakhi_2024';
}
if (!process.env.EMAIL_USER) {
    process.env.EMAIL_USER = 'jeevanamrit5@gmail.com';
}
if (!process.env.EMAIL_PASS) {
    process.env.EMAIL_PASS = 'eqjgvzedyqhpmlvj';
}

console.log('🔍 Environment variables loaded:');
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

// Connect to MongoDB with error handling
connectDB()
    .then(() => console.log("📊 MongoDB connected successfully in serverless function"))
    .catch(error => {
        console.error("❌ MongoDB connection failed in serverless function:", error.message);
        // Continue without exiting in serverless environment
    });

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
            console.log('📋 Allowed origins:', allowedOrigins);
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