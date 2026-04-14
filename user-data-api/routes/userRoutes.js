const express = require('express');
const router = express.Router();
const UserData = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await UserData.find().select('name email role -_id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a user
router.post('/', async (req, res) => {
    const user = new UserData({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    });

    try {
        const newUser = await user.save();
        const responseData = newUser.toObject();
        delete responseData._id;
        delete responseData.__v;
        res.status(201).json(responseData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a user (PUT)
router.put('/:id', (req, res) => {
    res.json({ message: `User ${req.params.id} updated via PUT`, data: req.body });
});

// Update partial user (PATCH)
router.patch('/:id', (req, res) => {
    res.json({ message: `User ${req.params.id} patched via PATCH`, data: req.body });
});

// Delete a user (DELETE)
router.delete('/:id', (req, res) => {
    res.json({ message: `User ${req.params.id} deleted via DELETE` });
});

// Head request (HEAD)
router.head('/', (req, res) => {
    res.status(200).end();
});

// Seed sample data
router.post('/seed', async (req, res) => {
    const sampleUsers = [
        { name: 'John Doe', email: 'john@example.com', role: 'admin' },
        { name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'user' }
    ];

    try {
        await UserData.deleteMany({});
        const createdUsers = await UserData.insertMany(sampleUsers);
        const cleanedUsers = createdUsers.map(u => {
            const obj = u.toObject();
            delete obj._id;
            delete obj.__v;
            return obj;
        });
        res.status(201).json({ message: 'Database seeded!', users: cleanedUsers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
