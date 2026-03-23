const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const Invite = require('../models/Invite');
const crypto = require('crypto');

// Get current user profile (From Request)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('organization', 'name');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        // Sanitize input: potentially populated fields (like organization) cause CastErrors if sent back as objects
        const { name, avatar, company, email } = req.body;

        // Email update might require verification in a real app, keeping it simple here
        const updates = { name, avatar, company };
        if (email) updates.email = email;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );
        res.json(user);
    } catch (err) {
        console.error('Profile update failed:', err);
        res.status(400).json({ message: err.message });
    }
};

exports.getTeam = async (req, res) => {
    try {
        // Only fetch users belonging to the same organization
        const team = await User.find({ organization: req.user.organization });
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({ message: 'Please provide name, email, and security role' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            name,
            email,
            password: 'welcome123', // Default password for invited members
            role,
            status: 'Pending',
            organization: req.user.organization, // Add to inviter's organization
            company: req.user.company,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
        });

        // 2. Dispatch Invitation Email
        try {
            const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
            await sendEmail({
                email: newUser.email,
                subject: 'CORSGuard: Enterprise Infrastructure Access Granted',
                message: `Hello ${newUser.name},\n\nYou have been granted access to the CORSGuard infrastructure as a ${newUser.role}.\n\nAccess Point: ${inviteUrl}\nTemporary Credential: welcome123\n\nPlease rotate your master password upon initial entry.`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #2563eb;">CORSGuard <span style="font-weight: 300;">Enterprise</span></h2>
                        <p>Hello <strong>${newUser.name}</strong>,</p>
                        <p>You have been cleared for infrastructure access. Your security profile has been initialized with the following parameters:</p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Security Role:</strong> ${newUser.role}</p>
                            <p style="margin: 5px 0;"><strong>Organization:</strong> ${req.user.company}</p>
                            <p style="margin: 5px 0;"><strong>Master ID:</strong> ${newUser.email}</p>
                            <p style="margin: 5px 0;"><strong>Temp Key:</strong> <code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">welcome123</code></p>
                        </div>
                        <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">Initialize Vault Session</a>
                        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This is a system-generated alert from your security infrastructure. If you did not expect this, please notify your system administrator immediately.</p>
                    </div>
                `
            });
            console.log(`✉️ Discovery dispatch successful to ${newUser.email}`);
        } catch (emailErr) {
            console.error('🚨 Automated dispatch failed:', emailErr);
            // We don't fail the request here, but we could notify the admin via toast (frontend logic)
        }

        // Broadcast member addition
        req.io.to(req.user.organization.toString()).emit('member_added', newUser);

        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);

        // Broadcast member removal
        req.io.to(req.user.organization.toString()).emit('member_removed', req.params.id);

        res.json({ message: 'User removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.generateInviteLink = async (req, res) => {
    try {
        const { role } = req.body;

        // Generate a random 6-character short code
        const code = crypto.randomBytes(4).toString('hex').slice(0, 8);

        await Invite.create({
            code,
            organization: req.user.organization,
            role: role || 'Viewer',
            inviter: req.user.name
        });

        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?code=${code}`;

        res.json({ inviteLink });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
