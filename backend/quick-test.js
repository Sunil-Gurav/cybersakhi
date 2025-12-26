// Quick MongoDB connection test
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Environment check:');
console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');

// Test simple connection
try {
    console.log('\n🔄 Testing simple connection...');
    const simpleConnect = (await import('./config/db-simple.js')).default;
    await simpleConnect();
    console.log('✅ Simple connection successful!');
    process.exit(0);
} catch (error) {
    console.error('❌ Simple connection failed:', error.message);
    
    // Test with even more basic options
    try {
        console.log('\n🔄 Testing basic connection...');
        const mongoose = await import('mongoose');
        await mongoose.default.connect(process.env.MONGO_URI);
        console.log('✅ Basic connection successful!');
        await mongoose.default.disconnect();
        process.exit(0);
    } catch (basicError) {
        console.error('❌ Basic connection failed:', basicError.message);
        process.exit(1);
    }
}