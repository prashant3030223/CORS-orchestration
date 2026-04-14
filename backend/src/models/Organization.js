const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, lowercase: true, unique: true }, // generated from name
    plan: { type: String, enum: ['Free', 'Pro', 'Enterprise'], default: 'Free' },
    apiKey: { type: String, unique: true, sparse: true }, // For API access
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', organizationSchema);
