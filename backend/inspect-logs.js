const mongoose = require('mongoose');
require('dotenv').config();
const Log = require('./src/models/Log');

const inspectLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🍃 Connected');

        const logs = await Log.find().limit(10);
        console.log('Total Logs Found:', await Log.countDocuments());
        console.log('Sample Logs:', JSON.stringify(logs, null, 2));

        const nullOrgLogs = await Log.countDocuments({ organization: null });
        console.log('Logs with Org NULL:', nullOrgLogs);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectLogs();
