const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CorsPolicy = require('../src/models/CorsPolicy');
const Organization = require('../src/models/Organization');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const action = process.argv[2]; // add, list, remove
const origin = process.argv[3];
const name = process.argv[4];

const managePolicy = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        if (action === 'list') {
            const policies = await CorsPolicy.find().populate('organization', 'name');
            console.log('--- Active CORS Policies ---');
            policies.forEach(p => {
                console.log(`[${p.organization.name}] ${p.name}: ${p.allowedOrigins.join(', ')}`);
            });
        } else if (action === 'add') {
            if (!origin || !name) {
                console.error('Usage: node policy_manager.js add <origin> <policy_name>');
                process.exit(1);
            }
            // Assign to default org for CLI
            const org = await Organization.findOne({ slug: 'cloudarmor-systems' });

            await CorsPolicy.create({
                organization: org._id,
                name: name,
                allowedOrigins: [origin],
                allowCredentials: true
            });
            console.log(`✅ Policy '${name}' created for ${origin}`);
        } else if (action === 'remove') {
            if (!origin) {
                console.error('Usage: node policy_manager.js remove <origin>');
                process.exit(1);
            }
            // Logic to find policy with this origin and remove the origin or delete policy
            // For simplicity, we'll delete any policy named by the 'origin' arg if name is passed, or just list
            console.log('Remove not fully implemented in CLI demo yet.');
        } else {
            console.log('Usage: node policy_manager.js <add|list|remove> ...');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

managePolicy();
