const mongoose = require('mongoose');
const CorsPolicy = require('../models/CorsPolicy');
const Log = require('../models/Log');
const Notification = require('../models/Notification');

const dynamicCorsMiddleware = async (req, res, next) => {
    const origin = req.headers.origin;
    const isInternalApi = req.path.startsWith('/api');

    // 1. Allow non-browser requests (no origin)
    if (!origin) {
        return next();
    }

    // MANDATORY: Always allow production URLs (Netlify, Vercel, and Local)
    const normalizedOrigin = (origin || '').replace(/\/$/, '');
    const isAllowed = 
        (process.env.CLIENT_URL && process.env.CLIENT_URL.replace(/\/$/, '') === normalizedOrigin) ||
        normalizedOrigin === 'https://cors-orchestration.netlify.app' ||
        normalizedOrigin === 'https://cors-orchestration.vercel.app' ||
        normalizedOrigin === 'http://localhost:5173' ||
        normalizedOrigin.endsWith('.netlify.app') ||
        normalizedOrigin.endsWith('.vercel.app');

    if (isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-org-id, Accept, Origin, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            return res.status(204).send();
        }
        return next();
    }

    let policies;
    if (!global.policyCache) global.policyCache = { data: null, lastFetch: 0 };

    try {
        const CACHE_TTL = 5000;
        const now = Date.now();
        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected) {
            if (global.policyCache.data && (now - global.policyCache.lastFetch < CACHE_TTL)) {
                policies = global.policyCache.data;
            } else {
                policies = await CorsPolicy.find({ isActive: true }).maxTimeMS(2000);
                global.policyCache = { data: policies, lastFetch: now };
            }
        } else {
            policies = []; // Degraded mode
        }

        const normalizeOrigin = (url) => url ? url.replace(/\/$/, '') : '';
        const normOrigin = normalizeOrigin(origin);

        // 1. GLOBAL BLACKLIST CHECK
        const isBlacklistedGlobally = policies.some(policy =>
            policy.blacklistedOrigins && policy.blacklistedOrigins.some(blocked => {
                const normBlocked = normalizeOrigin(blocked);
                if (normBlocked === normOrigin) return true;
                if (normBlocked.startsWith('*.')) {
                    const domain = normBlocked.slice(2);
                    try {
                        const originHostname = new URL(origin).hostname;
                        return originHostname === domain || originHostname.endsWith(`.${domain}`);
                    } catch (e) { return false; }
                }
                return false;
            })
        );

        if (isBlacklistedGlobally) {
            console.log(`🚫 CORS Blocked (Blacklisted) for origin: ${origin}`);
            return res.status(403).json({ error: 'CORS Blocked: Origin is blacklisted' });
        }

        // 2. Find a matching Allow Policy
        const matchedPolicy = policies.find(policy => {
            return policy.allowedOrigins.some(allowed => {
                const normAllowed = normalizeOrigin(allowed);
                if (normAllowed === '*' || normAllowed === normOrigin) return true;
                if (normAllowed.startsWith('*.')) {
                    const domain = normAllowed.slice(2);
                    try {
                        const originHostname = new URL(origin).hostname;
                        return originHostname === domain || originHostname.endsWith(`.${domain}`);
                    } catch (e) { return false; }
                }
                return false;
            });
        });

        if (matchedPolicy) {
            res.header('Access-Control-Allow-Origin', origin);
            const methods = (matchedPolicy.allowedMethods && matchedPolicy.allowedMethods.length > 0)
                ? (matchedPolicy.allowedMethods.includes('*') ? 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' : matchedPolicy.allowedMethods.join(', '))
                : 'GET, POST';
            res.header('Access-Control-Allow-Methods', methods);

            const headers = (matchedPolicy.allowedHeaders && matchedPolicy.allowedHeaders.length > 0)
                ? matchedPolicy.allowedHeaders.join(', ')
                : 'Content-Type, Authorization, x-api-key';
            res.header('Access-Control-Allow-Headers', headers);

            if (matchedPolicy.allowCredentials) res.header('Access-Control-Allow-Credentials', 'true');
            if (req.method === 'OPTIONS') return res.status(204).send();

            // Log Access
            if (!isInternalApi || (origin !== process.env.CLIENT_URL)) {
                Log.create({
                    organization: matchedPolicy.organization,
                    eventType: 'CORS Access',
                    apiEndpoint: matchedPolicy.name,
                    origin: origin,
                    method: req.method,
                    status: 'Allowed',
                    details: `Request allowed by policy: ${matchedPolicy.name}`
                }).then(newLog => {
                    if (req.io) req.io.to(matchedPolicy.organization.toString()).emit('log_received', newLog);
                }).catch(err => console.error('Logging failed', err));
            }
        } else {
            // Log Blocked Attempt
            const potentialOrg = policies.length > 0 ? policies[0].organization : null;
            if (potentialOrg && (!isInternalApi || origin !== process.env.CLIENT_URL)) {
                Log.create({
                    organization: potentialOrg,
                    eventType: 'Security Alert',
                    apiEndpoint: req.path,
                    origin: origin,
                    method: req.method,
                    status: 'Blocked',
                    details: 'Unauthorized cross-origin access attempt blocked by policy.'
                }).then(newLog => {
                    if (req.io) req.io.to(potentialOrg.toString()).emit('log_received', newLog);
                }).catch(err => console.error('Blocked log failed', err));

                Notification.create({
                    organization: potentialOrg,
                    type: 'security',
                    title: 'Security Threat Blocked',
                    message: `Unauthorized cross-origin attempt from ${origin} was intercepted.`,
                    priority: 'High'
                }).then(newNotif => {
                    if (req.io) req.io.to(potentialOrg.toString()).emit('notification_received', newNotif);
                }).catch(err => console.error('Blocked notification failed', err));
            }
        }

        next();
    } catch (error) {
        console.error('CORS Middleware Error:', error);
        next();
    }
};

module.exports = dynamicCorsMiddleware;
