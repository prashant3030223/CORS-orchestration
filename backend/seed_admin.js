const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const CorsPolicy = require('./src/models/CorsPolicy');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check if org exists
        let org = await Organization.findOne({ slug: 'cloudarmor-systems' });

        if (!org) {
            console.log('Creating Default Organization...');
            org = await Organization.create({
                name: 'CloudArmor Systems',
                slug: 'cloudarmor-systems',
                plan: 'Enterprise'
            });
        }

        // Seed Default CORS Policy for Frontend
        const policyExists = await CorsPolicy.findOne({ name: 'Development Access' });
        if (!policyExists) {
            console.log('Seeding Dev CORS Policy...');
            await CorsPolicy.create({
                organization: org._id,
                name: 'Development Access',
                allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
                allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                allowCredentials: true
            });
        }

        const email = 'prashant@enterprise.io';
        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('Admin user already exists. Updating password...');
            // Update to ensure correct hashing and org link
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            userExists.password = hashedPassword;
            userExists.organization = org._id;
            userExists.role = 'Global Admin';
            await userExists.save();
            console.log('Admin updated!');
        } else {
            console.log('Creating new Admin user...');
            await User.create({
                name: 'Prashant Yadav',
                email: email,
                password: 'password123', // Will be hashed by pre-save hook
                role: 'Global Admin',
                organization: org._id,
                company: org.name,
                avatar: 'PY'
            });
            console.log('Admin user seeded successfully!');
        }

        console.log('Email: prashant@enterprise.io');
        console.log('Password: password123');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
