const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const resetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        await mongoose.connection.db.dropDatabase();
        console.log('Database cleared (Dropped)');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetDB();
