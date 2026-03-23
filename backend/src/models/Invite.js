const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, required: true },
    inviter: { type: String, required: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // 7 days
}, { timestamps: true });

// Index to automatically delete expired invites
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invite', inviteSchema);
