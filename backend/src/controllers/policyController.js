const CorsPolicy = require('../models/CorsPolicy');
const Log = require('../models/Log');
const Api = require('../models/Api');
const User = require('../models/User');

exports.getPolicyByApiId = async (req, res) => {
    try {
        const policy = await CorsPolicy.findOne({ apiId: req.params.apiId });
        if (!policy) {
            return res.json({
                allowedOrigins: [],
                allowedMethods: ['GET', 'POST'],
                allowCredentials: false,
                isNew: true
            });
        }
        res.json(policy);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePolicy = async (req, res) => {
    try {
        const { apiId, allowedOrigins, blacklistedOrigins, allowedMethods, allowedHeaders, allowCredentials, isDeploying } = req.body;

        if (!apiId) return res.status(400).json({ message: 'apiId is required' });

        // Fetch API - handle cases where API discovery hasn't fully synced
        const api = await Api.findById(apiId);
        const apiName = api ? api.name : 'Unknown API';
        
        // Super Robust Organization Fallback
        let orgId = req.user?.organization || api?.organization;
        if (!orgId && req.user?.id) {
            const user = await User.findById(req.user.id);
            orgId = user?.organization;
        }

        if (!orgId) {
            return res.status(400).json({ message: 'Authentication Error: Organization context missing. Please re-login.' });
        }

        // Upsert policy
        const policy = await CorsPolicy.findOneAndUpdate(
            { apiId }, 
            {
                organization: orgId,
                apiId,
                name: `${apiName} Policy`,
                allowedOrigins: allowedOrigins || [],
                blacklistedOrigins: blacklistedOrigins || [],
                allowedMethods: allowedMethods || ['GET', 'POST'],
                allowedHeaders: allowedHeaders || ['Content-Type', 'Authorization', 'x-api-key'],
                allowCredentials: !!allowCredentials,
                isActive: true
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Notify via Socket for REAL-TIME propagation
        if (req.io) {
            req.io.to(orgId.toString()).emit('policy_updated', {
                apiId,
                name: policy.name,
                timestamp: new Date()
            });
        }

        if (isDeploying) {
            await Log.create({
                organization: orgId,
                eventType: 'Policy Update',
                apiEndpoint: apiName,
                origin: 'INTERNAL_ADMIN',
                status: 'Allowed',
                severity: 'Low',
                details: `CORS policy deployed. Allowed Origins: ${allowedOrigins?.length || 0}, Methods: ${allowedMethods?.join(', ') || 'Default'}`
            });

            // Specific event for "Deployment"
            if (req.io) {
                req.io.to(orgId.toString()).emit('deployment_complete', {
                    apiId,
                    apiName,
                    timestamp: new Date()
                });
            }
        }

        // Invalidate global policy cache
        if (global.policyCache) {
            global.policyCache.data = null;
            global.policyCache.lastFetch = 0;
        }

        res.json(policy);
    } catch (err) {
        console.error('Update Policy Error:', err);
        res.status(400).json({ message: `Database Error: ${err.message}` });
    }
};
