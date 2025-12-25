import mongoose from "mongoose";

// Global variable to cache the connection
let cachedConnection = null;

const connectDB = async() => {
    // If we have a cached connection and it's connected, use it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        console.log('🔍 MongoDB - Attempting new connection...');
        console.log('🔍 MongoDB - MONGO_URI exists:', !!process.env.MONGO_URI);
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        console.log('🔍 MongoDB - Using URI:', mongoUri.substring(0, 30) + '...');
        
        // Serverless-optimized connection options
        const options = {
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0,   // Disable mongoose buffering
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for serverless
            socketTimeoutMS: 30000, // Reduced to 30 seconds for faster timeout
            connectTimeoutMS: 10000, // Connection timeout
            maxPoolSize: 1, // Single connection for serverless
            minPoolSize: 0,  // No minimum connections for serverless
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
        };
        
        // Disconnect any existing connection first
        if (mongoose.connection.readyState !== 0) {
            console.log('🔄 Disconnecting existing MongoDB connection...');
            await mongoose.disconnect();
        }
        
        const conn = await mongoose.connect(mongoUri, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Cache the connection
        cachedConnection = conn;
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            cachedConnection = null;
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            cachedConnection = null;
        });
        
        return conn;
    } catch (err) {
        console.error(`❌ MongoDB Error: ${err.message}`);
        console.error(`❌ MongoDB Stack: ${err.stack}`);
        cachedConnection = null;
        
        // For serverless, throw the error to be handled by the calling function
        throw new Error(`MongoDB connection failed: ${err.message}`);
    }
};

export default connectDB;