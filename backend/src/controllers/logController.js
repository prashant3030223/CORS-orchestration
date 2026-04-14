const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find({ organization: req.user.organization }).sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createLog = async (req, res) => {
    const log = new Log({
        ...req.body,
        organization: req.user.organization
    });
    try {
        const newLog = await log.save();
        req.io.to(req.user.organization.toString()).emit('log_received', newLog);
        res.status(201).json(newLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.clearLogs = async (req, res) => {
    try {
        await Log.deleteMany({ organization: req.user.organization });
        res.json({ message: 'Audit logs cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
