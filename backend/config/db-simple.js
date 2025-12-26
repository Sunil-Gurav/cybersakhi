// Simple MongoDB connection without problematic options
import mongoose from "mongoose";

const simpleConnect = async () => {
    try {
        console.log('🔍 Simple Connect - Starting...');
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        console.log('🔍 Simple Connect - URI exists:', !!process.env.MONGO_URI);
        
        // Minimal connection options
        const options = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
        };
        
        const conn = await mongoose.connect(mongoUri, options);
        console.log(`✅ Simple Connect - Connected: ${conn.connection.host}`);
        
        return conn;
    } catch (error) {
        console.error('❌ Simple Connect Error:', error.message);
        throw error;
    }
};

export default simpleConnect;