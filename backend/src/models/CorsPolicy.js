const mongoose = require('mongoose');

const corsPolicySchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: false }, // Link to specific API
    name: { type: String, required: true }, // e.g., "Partner Access"
    allowedOrigins: [{ type: String, required: true }], // e.g., ["https://partner.com", "*.google.com"]
    blacklistedOrigins: [{ type: String }], // Explicitly blocked origins
    allowedMethods: [{ type: String, default: ['GET', 'POST'] }], // GET, POST, PUT, DELETE, OPTIONS
    allowedHeaders: [{ type: String, default: ['Content-Type', 'Authorization'] }],
    allowCredentials: { type: Boolean, default: false },
    maxAge: { type: Number, default: 86400 }, // Preflight cache time in seconds
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique policy name per organization
corsPolicySchema.index({ organization: 1, name: 1 }, { unique: true });
// Fast lookup for active policies
corsPolicySchema.index({ isActive: 1 });

module.exports = mongoose.model('CorsPolicy', corsPolicySchema);
