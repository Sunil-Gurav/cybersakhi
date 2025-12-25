// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js"; // ⭐ added
import userDataRoutes from "./routes/userDataRoutes.js"; // ⭐ added for user data
import crimeAnalysisRoutes from "./routes/crimeAnalysisRoutes.js"; // ⭐ NEW: Crime Analysis Routes

// ⭐ NEW: Import AI Location Analysis Routes
import locationAnalysisRoutes from "./routes/ai/location-analysis.js";
import userActivityRoutes from "./routes/userActivityRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Create HTTP + SOCKET.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Attach io globally to APP
app.set("io", io);

// SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  // ⭐ NEW: Location analysis events
  socket.on("request-location-analysis", async (data) => {
    try {
      console.log("📍 Location analysis requested:", data);
      // You can emit real-time location analysis updates here
      socket.emit("location-analysis-update", {
        status: "processing",
        message: "AI is analyzing your location safety...",
      });
    } catch (error) {
      socket.emit("location-analysis-error", {
        error: "Failed to process location analysis",
      });
    }
  });

  // ⭐ NEW: Real-time safety alerts
  socket.on("subscribe-safety-alerts", (userId) => {
    console.log(`🛡️ User ${userId} subscribed to safety alerts`);
    socket.join(`user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// MAIN API ROUTES
app.get("/", (req, res) => {
  res.send("🚀 CyberSathi Backend Running...");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "CyberSathi Backend",
    timestamp: new Date().toISOString(),
    ai_service: process.env.AI_SERVICE_URL || "http://localhost:8000",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/user-data", userDataRoutes);
app.use("/api/crime-analysis", crimeAnalysisRoutes); // ⭐ NEW: Crime Analysis Routes

// ⭐ NEW: AI Location Analysis Routes
app.use("/api/ai", locationAnalysisRoutes);
app.use("/api/activities", userActivityRoutes);
app.use("/api/family", familyRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(
    `🔗 AI Service: ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`
  );
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
