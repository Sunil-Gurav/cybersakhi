import mongoose from "mongoose";

// Global variable to cache the connection
let cachedConnection = null;
let isConnecting = false;

const connectDB = async() => {
    // If we have a cached connection and it's connected, use it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cachedConnection;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('⏳ Connection attempt already in progress, waiting...');
        // Wait for the current connection attempt to complete
        let attempts = 0;
        while (isConnecting && attempts < 50) { // Wait up to 5 seconds
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (mongoose.connection.readyState === 1) {
            return cachedConnection;
        }
    }

    try {
        isConnecting = true;
        console.log('🔍 MongoDB - Attempting new connection...');
        console.log('🔍 MongoDB - MONGO_URI exists:', !!process.env.MONGO_URI);
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        console.log('🔍 MongoDB - Using URI:', mongoUri.substring(0, 30) + '...');
        
        // Disconnect any existing connection first
        if (mongoose.connection.readyState !== 0) {
            console.log('🔄 Disconnecting existing MongoDB connection...');
            await mongoose.disconnect();
            // Wait for disconnection to complete
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Serverless-optimized connection options
        const options = {
            // Mongoose-specific options
            bufferCommands: false, // Disable mongoose buffering for serverless
            bufferMaxEntries: 0,   // Disable mongoose buffering queue
            
            // MongoDB driver options
            serverSelectionTimeoutMS: 8000, // 8 seconds for server selection
            socketTimeoutMS: 25000, // 25 seconds for socket operations
            connectTimeoutMS: 8000, // 8 seconds for initial connection
            maxPoolSize: 1, // Single connection for serverless
            minPoolSize: 0,  // No minimum connections for serverless
            maxIdleTimeMS: 25000, // Close connections after 25 seconds of inactivity
            heartbeatFrequencyMS: 8000, // Check connection every 8 seconds
        };
        
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
    } finally {
        isConnecting = false;
    }
};

export default connectDB;