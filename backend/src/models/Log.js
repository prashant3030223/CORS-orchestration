const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    eventType: { type: String, required: true }, // e.g., 'CORS Block', 'Policy Update', 'API Discovery'
    sourceIp: { type: String },
    origin: { type: String },
    apiEndpoint: { type: String },
    status: { type: String, enum: ['Blocked', 'Allowed', 'Modified'], default: 'Allowed' },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    details: { type: String }
}, { timestamps: true });

// Compound index for analytics queries (e.g., Request count per org per day)
logSchema.index({ organization: 1, timestamp: -1 });
logSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('Log', logSchema);
