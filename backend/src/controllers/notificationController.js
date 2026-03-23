const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });
        res.json({ message: 'All marked read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.clearVault = async (req, res) => {
    try {
        await Notification.deleteMany();
        res.json({ message: 'Vault cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
