const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['security', 'policy', 'alert', 'system'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
