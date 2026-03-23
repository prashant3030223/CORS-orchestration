const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('🔍 Diagnostic Started...');
console.log('📡 Attempting to connect to MongoDB Atlas...');
console.log(`🔗 URI: ${uri.replace(/:([^:@]{1,})@/, ':****@')}`); // Mask password

const connect = async () => {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Success! MongoDB is reachable and credentials are valid.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Connection Failed!');
        console.error('-------------------');
        console.error(`Error Name: ${err.name}`);
        console.error(`Error Message: ${err.message}`);

        if (err.name === 'MongoServerSelectionError') {
            console.error('\n💡 Diagnosis: IP Whitelist Issue');
            console.error('The application timed out trying to reach the Atlas cluster.');
            console.error('This is almost always because your current IP address is not whitelisted.');
            console.error('\nSteps to fix:');
            console.error('1. Go to https://cloud.mongodb.com/');
            console.error('2. Security -> Network Access');
            console.error('3. Add your current IP (or 0.0.0.0/0 for anywhere)');
        }
        process.exit(1);
    }
};

connect();
