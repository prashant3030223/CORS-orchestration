const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');

const inspectUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find().populate('organization').limit(5);
        console.log('Users found:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectUsers();
