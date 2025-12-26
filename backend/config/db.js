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
        
        // Connection options optimized for compatibility
        const options = {
            // Enable buffering for local development, disable for production
            bufferCommands: process.env.NODE_ENV === 'production' ? false : true,
            
            // Connection timeouts
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 25000,
            connectTimeoutMS: 8000,
            
            // Connection pool settings
            maxPoolSize: process.env.NODE_ENV === 'production' ? 1 : 5,
            minPoolSize: 0,
            maxIdleTimeMS: 25000,
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