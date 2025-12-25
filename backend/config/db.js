import mongoose from "mongoose";

const connectDB = async() => {
    try {
        console.log('🔍 MongoDB - Attempting connection...');
        console.log('🔍 MongoDB - MONGO_URI exists:', !!process.env.MONGO_URI);
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        console.log('🔍 MongoDB - Using URI:', mongoUri.substring(0, 20) + '...');
        
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.error(`❌ MongoDB Error: ${err.message}`);
        console.error(`❌ MongoDB Stack: ${err.stack}`);
        // Don't exit in serverless environment
        throw err;
    }
};

export default connectDB;