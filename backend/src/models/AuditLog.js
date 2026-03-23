const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who performed the action
    action: { type: String, required: true }, // CREATE, UPDATE, DELETE
    resourceType: { type: String, required: true }, // CorsPolicy, Api, User
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    changes: { type: Object }, // Before/After snapshot or diff
    ipAddress: { type: String },
    userAgent: { type: String }
}, { timestamps: true });

// Index for quick history lookup
auditLogSchema.index({ organization: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
