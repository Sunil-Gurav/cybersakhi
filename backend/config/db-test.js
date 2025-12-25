// Special MongoDB connection for testing that allows buffering
import mongoose from "mongoose";

const testConnection = async () => {
    try {
        console.log('🔍 Test Connection - Starting...');
        
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybersakhi';
        
        // Test connection options with buffering enabled
        const testOptions = {
            bufferCommands: true,  // Enable buffering for testing
            bufferMaxEntries: 10,  // Allow some buffering
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
            maxPoolSize: 1,
            minPoolSize: 0,
        };
        
        // Create a separate connection for testing
        const testConn = await mongoose.createConnection(mongoUri, testOptions);
        
        console.log('✅ Test Connection - Connected to:', testConn.host);
        
        // Test basic operations
        const testResult = {
            host: testConn.host,
            dbName: testConn.name,
            readyState: testConn.readyState,
            connected: testConn.readyState === 1
        };
        
        // Try to get collection stats
        try {
            const collections = await testConn.db.listCollections().toArray();
            testResult.collections = collections.map(c => c.name);
        } catch (err) {
            testResult.collectionsError = err.message;
        }
        
        // Close the test connection
        await testConn.close();
        
        return testResult;
    } catch (error) {
        console.error('❌ Test Connection Error:', error);
        throw error;
    }
};

export default testConnection;