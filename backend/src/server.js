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
        origin: [process.env.CLIENT_URL, "https://cors-orchestration.netlify.app", "https://cors-orchestration.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true
    }
});

// Middleware
const dynamicCorsMiddleware = require('./middleware/dynamicCorsMiddleware');
app.use(express.json({ limit: '50mb' }));

// 🛡️ Global CORS Configuration
app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            process.env.CLIENT_URL,
            'https://cors-orchestration.netlify.app',
            'https://cors-orchestration.vercel.app',
            'http://localhost:5173'
        ];
        if (!origin || allowed.some(url => url && url.replace(/\/$/, '') === origin.replace(/\/$/, '')) || origin.endsWith('.netlify.app') || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORSGuard'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-org-id', 'Accept', 'Origin', 'X-Requested-With']
}));

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
        socket.join(orgId.toString());
        console.log(`📡 Client joined organization vault: ${orgId}`);
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
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`🍃 MongoDB connected: ${conn.connection.host}`);
        
        // 🗑️ FORCE DROP problematic unique index
        try {
            await mongoose.connection.collection('corspolicies').dropIndex('organization_1_name_1');
            console.log('🗑️ Successfully dropped old unique index.');
        } catch (e) {
            // Index might not exist, which is fine
        // 📡 Real-time Database Watchers (Change Streams)
        const logChangeStream = mongoose.connection.collection('logs').watch();
        logChangeStream.on('change', (change) => {
            if (change.operationType === 'insert') {
                const newLog = change.fullDocument;
                if (newLog.organization) {
                    io.to(newLog.organization.toString()).emit('log_received', newLog);
                }
            }
        });

        const notificationChangeStream = mongoose.connection.collection('notifications').watch();
        notificationChangeStream.on('change', (change) => {
            if (change.operationType === 'insert') {
                const newNotif = change.fullDocument;
                if (newNotif.organization) {
                    io.to(newNotif.organization.toString()).emit('notification_received', newNotif);
                }
            }
        });

        console.log('📡 Real-time Database Watchers operational.');

    } catch (err) {
        console.error('🚨 MongoDB Connection Failure:', err.message);
    }
};

connectDB();

// Routes
app.get('/', (req, res) => {
    res.json({ status: 'active', version: '1.2.0', service: 'CORSGuard-Engine' });
});

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
