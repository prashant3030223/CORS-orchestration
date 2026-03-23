require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Custom Dynamic CORS Middleware
const normalizeOrigin = (url) => url ? url.replace(/\/$/, '') : '';

// Custom Dynamic CORS Middleware
const dynamicCorsMiddleware = async (req, res, next) => {
    const originRaw = req.headers.origin;
    if (!originRaw) return next();
    const origin = normalizeOrigin(originRaw);

    try {
        // Query the SAME database collection as the main backend
        const policies = await mongoose.connection.db.collection('corspolicies').find({ isActive: true }).toArray();

        // 1. GLOBAL BLACKLIST CHECK (Highest Priority)
        const isBlacklistedGlobally = policies.some(policy =>
            policy.blacklistedOrigins && policy.blacklistedOrigins.some(blocked => {
                const normBlocked = normalizeOrigin(blocked);
                if (normBlocked === origin) return true;
                if (normBlocked.startsWith('*.')) {
                    const domain = normBlocked.slice(2);
                    try {
                        const originUrl = new URL(originRaw);
                        const originHostname = originUrl.hostname;
                        return originHostname === domain || originHostname.endsWith(`.${domain}`);
                    } catch (e) { return false; }
                }
                return false;
            })
        );

        if (isBlacklistedGlobally) {
            console.log(`🚫 CORS Blocked (Globally Blacklisted) for origin: ${originRaw}`);
            return res.status(403).json({ error: 'CORS Blocked: Origin is blacklisted' });
        }

        // 2. MANDATORY DASHBOARD ALLOW (Safe Default)
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
        if (originRaw === CLIENT_URL || origin === normalizeOrigin(CLIENT_URL)) {
            res.header('Access-Control-Allow-Origin', originRaw);
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
            res.header('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') return res.status(200).end();
            return next();
        }

        // 3. Check for an Allow Match
        const matchedPolicy = policies.find(policy => {
            return policy.allowedOrigins.some(allowed => {
                const normAllowed = normalizeOrigin(allowed);
                if (normAllowed === '*' || normAllowed === origin) return true;
                if (normAllowed.startsWith('*.')) {
                    const domain = normAllowed.slice(2);
                    try {
                        const originUrl = new URL(originRaw);
                        const originHostname = originUrl.hostname;
                        return originHostname === domain || originHostname.endsWith(`.${domain}`);
                    } catch (e) { return false; }
                }
                return false;
            });
        });

        if (matchedPolicy) {
            res.header('Access-Control-Allow-Origin', originRaw);

            // Handle Wildcard Methods
            const methods = (matchedPolicy.allowedMethods && matchedPolicy.allowedMethods.length > 0)
                ? (matchedPolicy.allowedMethods.includes('*') ? 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' : matchedPolicy.allowedMethods.join(', '))
                : 'GET, POST, PUT, DELETE, OPTIONS';
            res.header('Access-Control-Allow-Methods', methods);

            // Handle Headers
            const headers = (matchedPolicy.allowedHeaders && matchedPolicy.allowedHeaders.length > 0)
                ? matchedPolicy.allowedHeaders.join(', ')
                : 'Content-Type, Authorization, x-api-key';
            res.header('Access-Control-Allow-Headers', headers);

            if (matchedPolicy.allowCredentials) res.header('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') return res.status(200).end();
            return next();
        } else {
            console.log(`🚫 CORS Blocked (No Allow Match) for origin: ${originRaw}`);

            // Log to main DB 'logs' and 'notifications' collections
            const potentialOrg = policies.length > 0 ? policies[0].organization : null;
            if (potentialOrg && (originRaw !== CLIENT_URL)) {
                const timestamp = new Date();

                // 1. Audit Log
                mongoose.connection.db.collection('logs').insertOne({
                    organization: potentialOrg,
                    eventType: 'Security Alert',
                    apiEndpoint: req.path,
                    origin: originRaw,
                    method: req.method,
                    status: 'Blocked',
                    details: 'Unauthorized cross-origin access attempt blocked by Test API.',
                    timestamp: timestamp
                }).catch(err => console.error('Blocked log failed', err));

                // 2. Intelligence Alert
                mongoose.connection.db.collection('notifications').insertOne({
                    organization: potentialOrg,
                    type: 'security',
                    title: 'Security Threat Blocked (Test API)',
                    message: `Unauthorized attempt from ${originRaw} intercepted by Test API.`,
                    priority: 'High',
                    read: false,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }).catch(err => console.error('Blocked notification failed', err));
            }

            return res.status(403).json({ error: 'CORS Blocked: No matching allow-policy found' });
        }
    } catch (err) {
        console.error('CORS Middleware Error:', err);
        next();
    }
};

app.use(dynamicCorsMiddleware);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'API is running', version: '1.0.0' });
});

// Routes
app.use('/api/users', userRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Start Server
app.listen(PORT, () => {
    console.log(`User Data API running on port ${PORT}`);
});
