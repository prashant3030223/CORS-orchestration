const mongoose = require('mongoose');
require('dotenv').config();
const Log = require('./src/models/Log');
const Organization = require('./src/models/Organization');

const fixLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🍃 Connected to MongoDB');

        // 1. Get the first organization (assuming single-tenant for this specific user's fix)
        const org = await Organization.findOne();
        if (!org) {
            console.error('❌ No organization found. Run seeding first.');
            process.exit(1);
        }

        console.log(`📡 Found organization: ${org.name} (${org._id})`);

        // 2. Update all logs that have organization: null
        const result = await Log.updateMany(
            { organization: null },
            { $set: { organization: org._id } }
        );

        console.log(`✅ Successfully associated ${result.modifiedCount} logs with organization ${org.name}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Fix failed:', err);
        process.exit(1);
    }
};

fixLogs();
