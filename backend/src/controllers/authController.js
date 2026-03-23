const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const jwt = require('jsonwebtoken');
const { getMockUser } = require('../utils/mockDb');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Database connection check
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database disconnected. Please check your MongoDB IP whitelist settings.' });
    }

    try {
        const user = await User.findOne({ email }).maxTimeMS(2000);

        if (user && (await user.matchPassword(password))) {
            user.lastLogin = Date.now();
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                organization: user.organization,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Register a new user (New Organization)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, companyName, role, inviteToken, inviteCode } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email identity' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Security protocol requires password >= 8 characters' });
    }

    // Database connection check
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database disconnected. Please check your MongoDB IP whitelist settings.' });
    }

    try {
        const userExists = await User.findOne({ email }).maxTimeMS(2000);

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let orgId;
        let assignedRole = role || 'Global Admin';

        if (inviteCode) {
            const invite = await Invite.findOne({ code: inviteCode });
            if (!invite) {
                return res.status(400).json({ message: 'Invalid or expired invite link' });
            }
            orgId = invite.organization;
            assignedRole = invite.role;
            // Optionally delete invite here or keep it multi-use
        } else if (inviteToken) {
            try {
                const decodedInvite = jwt.verify(inviteToken, process.env.JWT_SECRET);
                orgId = decodedInvite.orgId;
                assignedRole = decodedInvite.role;
            } catch (err) {
                return res.status(400).json({ message: 'Invalid or expired invite link' });
            }
        } else {
            // Create new Organization only if no invite link
            const organization = await Organization.create({
                name: companyName || 'My Organization',
                slug: (companyName || 'my-org').toLowerCase().replace(/ /g, '-') + '-' + Date.now()
            });
            orgId = organization._id;
        }

        // Create User linked to Organization
        const user = await User.create({
            name,
            email,
            password,
            organization: orgId,
            role: assignedRole,
            company: companyName, // Will be updated on login or via fetch if needed
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyInviteToken = async (req, res) => {
    try {
        const { token } = req.params;

        // Try code lookup first
        const invite = await Invite.findOne({ code: token }).populate('organization', 'name');

        if (invite) {
            return res.json({
                organizationName: invite.organization.name,
                role: invite.role,
                inviter: invite.inviter
            });
        }

        // Fallback to JWT (legacy)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const organization = await Organization.findById(decoded.orgId).select('name');
            if (!organization) throw new Error();

            return res.json({
                organizationName: organization.name,
                role: decoded.role,
                inviter: decoded.inviter
            });
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired invite link' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
