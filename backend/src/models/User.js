const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Viewer', enum: ['Global Admin', 'Security Lead', 'DevOps', 'Auditor', 'Viewer'] },
    status: { type: String, default: 'Active', enum: ['Active', 'Pending', 'Inactive'] },
    avatar: { type: String },
    company: { type: String },
    lastLogin: { type: Date }
}, { timestamps: true });

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
