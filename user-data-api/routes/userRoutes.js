const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a user
router.post('/', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
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
        await User.deleteMany({});
        const createdUsers = await User.insertMany(sampleUsers);
        res.status(201).json({ message: 'Database seeded!', users: createdUsers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
