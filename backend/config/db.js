import mongoose from "mongoose";

const connectDB = async() => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;