const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
const dynamicCorsMiddleware = require('./middleware/dynamicCorsMiddleware');
app.use(express.json({ limit: '50mb' }));

// Attach IO to request for controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(dynamicCorsMiddleware);

// Socket.io Real-time Protocol
io.on('connection', (socket) => {
    console.log('⚡ Client connected to security stream:', socket.id);

    socket.on('join_org', (orgId) => {
        if (!orgId) return;
        const roomName = orgId.toString();

        // Prevent redundant logs if already in room
        const isAlreadyJoined = socket.rooms.has(roomName);
        if (!isAlreadyJoined) {
            socket.join(roomName);
            console.log(`📡 Client joined organization vault: ${orgId}`);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected from stream (${reason}):`, socket.id);
    });
});

// Database Connection Handling
const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        });
        console.log(`🍃 MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('🚨 MongoDB Connection Failure:', err.message);
        // Don't exit process in dev, maybe it's just a temporary network blip or IP whitelist issue
        console.log('⚠️ Running in degraded mode: Some database-dependent features may fail.');
    }
};

connectDB();

mongoose.connection.on('disconnected', () => {
    console.log('🔌 MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

// Attach IO to request for controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.json({ status: 'active', version: '1.2.0', service: 'CORSGuard-Engine' });
});

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/apiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 CORSGuard-Engine operational on port ${PORT}`);
});
