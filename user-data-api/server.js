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
// Custom Dynamic CORS Middleware
const dynamicCorsMiddleware = async (req, res, next) => {
    const originRaw = req.headers.origin;
    if (!originRaw) return next();
    const origin = normalizeOrigin(originRaw);

    try {
        const policies = await mongoose.connection.db.collection('corspolicies').find({ isActive: true }).toArray();
        const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

        // Unified Logging Helper
        const recordSecurityEvent = async (status, details, sourcePolicy = null) => {
            let targetOrg = sourcePolicy ? sourcePolicy.organization : null;
            
            // Fallback: If no organization ID in policy, find ANY available organization
            if (!targetOrg) {
                const fallbackPolicy = policies.find(p => p.organization);
                if (fallbackPolicy) {
                    targetOrg = fallbackPolicy.organization;
                } else {
                    const firstOrg = await mongoose.connection.db.collection('organizations').findOne({});
                    targetOrg = firstOrg ? firstOrg._id : null;
                }
            }

            if (targetOrg) {
                const timestamp = new Date();
                const isAllowed = status === 'Allowed';

                // 1. Audit Log 
                await mongoose.connection.db.collection('logs').insertOne({
                    organization: targetOrg,
                    eventType: isAllowed ? 'CORS Access' : 'Security Alert',
                    apiEndpoint: 'User Data API',
                    origin: originRaw,
                    method: req.method,
                    status: status,
                    details: details,
                    timestamp: timestamp
                });

                // 2. Intelligence Alert
                await mongoose.connection.db.collection('notifications').insertOne({
                    organization: targetOrg,
                    type: isAllowed ? 'policy' : 'security',
                    title: isAllowed ? 'Authorized Access (User API)' : 'Security Threat Blocked (User API)',
                    message: isAllowed 
                        ? `Origin ${originRaw} accessed User API via ${req.method}`
                        : `Origin ${originRaw} attempted unauthorized ${req.method} access`,
                    priority: isAllowed ? 'Low' : 'High',
                    read: false,
                    createdAt: timestamp,
                    updatedAt: timestamp
                });
                console.log(`📡 Security Feed Updated: ${status} [${originRaw}]`);
            }
        };

        // 1. Global Blacklist Check
        const blacklisted = policies.find(p => 
            p.blacklistedOrigins?.some(b => {
                const normB = normalizeOrigin(b);
                if (normB === origin) return true;
                if (normB.startsWith('*.')) {
                    try { return new URL(originRaw).hostname.endsWith(normB.slice(1)); } catch(e) { return false; }
                }
                return false;
            })
        );

        if (blacklisted) {
            console.log(`🚫 Blocked (Global Blacklist): ${originRaw}`);
            await recordSecurityEvent('Blocked', `Origin is globally blacklisted: ${originRaw}`, blacklisted);
            return res.status(403).json({ error: 'CORS Blocked: Origin is blacklisted' });
        }

        // 2. System Bypass (Dashboard)
        if (originRaw === CLIENT_URL || origin === normalizeOrigin(CLIENT_URL)) {
            res.header('Access-Control-Allow-Origin', originRaw);
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
            res.header('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') return res.status(200).end();
            return next();
        }

        // 3. Dynamic Policy Match
        const matched = policies.find(p => 
            p.allowedOrigins?.some(a => {
                const normA = normalizeOrigin(a);
                if (normA === '*' || normA === origin) return true;
                if (normA.startsWith('*.')) {
                    try { return new URL(originRaw).hostname.endsWith(normA.slice(1)); } catch(e) { return false; }
                }
                return false;
            })
        );

        if (matched) {
            res.header('Access-Control-Allow-Origin', originRaw);
            const methods = matched.allowedMethods?.includes('*') 
                ? 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' 
                : (matched.allowedMethods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Methods', methods);
            res.header('Access-Control-Allow-Headers', matched.allowedHeaders?.join(', ') || 'Content-Type, Authorization, x-api-key');
            if (matched.allowCredentials) res.header('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') return res.status(200).end();

            await recordSecurityEvent('Allowed', `Access granted by policy: ${matched.name}`, matched);
            return next();
        } else {
            console.log(`🚫 Blocked (No Policy Match): ${originRaw}`);
            await recordSecurityEvent('Blocked', `No matching allow-policy found for origin: ${originRaw}`);
            return res.status(403).json({ error: 'CORS Blocked: No matching policy' });
        }
    } catch (err) {
        console.error('CORS Engine Error:', err);
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
