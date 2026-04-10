const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    key: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Primary indexes for efficient MongoDB query and auth enforcement
apiSchema.index({ key: 1 }, { unique: true });
// Group APIs by Organization for fast filtering
apiSchema.index({ organization: 1 });

module.exports = mongoose.model('Api', apiSchema);
