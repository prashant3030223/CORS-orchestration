const Api = require('../models/Api');
const Notification = require('../models/Notification');

exports.getApis = async (req, res) => {
    try {
        const apis = await Api.find({ organization: req.user.organization }).sort({ createdAt: -1 });
        res.json(apis);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createApi = async (req, res) => {
    const { name, url, key } = req.body;

    // Validation
    if (!name || !url || !key) {
        return res.status(400).json({ message: 'Instance name, URL, and security key are required' });
    }

    const api = new Api({
        ...req.body,
        organization: req.user.organization, // Link API to organization
        owner: req.user._id // Set owner ID
    });

    try {
        const newApi = await api.save();

        // Broadcast via Socket.io to organization room
        req.io.to(req.user.organization.toString()).emit('api_created', newApi);

        // Create Notification
        const notification = new Notification({
            organization: req.user.organization,
            type: 'policy',
            title: 'New API Registered',
            message: `${newApi.name} has been added to the infrastructure.`
        });
        await notification.save();
        req.io.to(req.user.organization.toString()).emit('notification_received', notification);

        res.status(201).json(newApi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateApi = async (req, res) => {
    try {
        const updatedApi = await Api.findByIdAndUpdate(req.params.id, req.body, { new: true });
        req.io.to(req.user.organization.toString()).emit('api_updated', updatedApi);
        res.json(updatedApi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteApi = async (req, res) => {
    try {
        await Api.findByIdAndDelete(req.params.id);
        req.io.to(req.user.organization.toString()).emit('api_deleted', req.params.id);
        res.json({ message: 'API Decommissioned' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
