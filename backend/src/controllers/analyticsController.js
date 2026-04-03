const mongoose = require('mongoose');
const Api = require('../models/Api');
const Log = require('../models/Log');
const Notification = require('../models/Notification');
const { getMockDashboardStats } = require('../utils/mockDb');

exports.getDashboardStats = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        console.log('💡 DB Offline: Serving Mock Dashboard Data');
        return res.json(getMockDashboardStats());
    }

    try {
        const query = { organization: req.user.organization };
        const totalApis = await Api.countDocuments(query);
        const totalRequests = await Log.countDocuments(query);
        const allowedRequests = await Log.countDocuments({ ...query, status: 'Allowed' });
        const blockedRequests = await Log.countDocuments({ ...query, status: { $ne: 'Allowed' } });
        const policyStats = await Log.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const policyDistribution = {
            Allowed: 0,
            Blocked: 0,
            Modified: 0
        };

        policyStats.forEach(stat => {
            if (policyDistribution.hasOwnProperty(stat._id)) {
                policyDistribution[stat._id] = stat.count;
            } else {
                policyDistribution.Blocked += stat.count;
            }
        });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); 
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const trafficAggregation = await Log.aggregate([
            {
                $match: {
                    ...query,
                    timestamp: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const trafficData = {
            labels: [],
            data: []
        };

        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const found = trafficAggregation.find(item => item._id === dateStr);

            trafficData.labels.push(dateLabel);
            trafficData.data.push(found ? found.count : 0);
        }

        const recentActivity = await Log.find(query).sort({ timestamp: -1 }).limit(5);

        res.json({
            counts: {
                apis: totalApis,
                requests: totalRequests,
                allowed: allowedRequests,
                blocked: blockedRequests
            },
            policyDistribution,
            trafficData,
            recentActivity
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getAnalyticsData = async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            originStats: [],
            rpmData: Array(24).fill(0),
            summary: { activeOrigins: 0, blockPercentage: '0.00', peakRpm: '0.00' },
            error: 'Database disconnected. Please check your IP whitelist in MongoDB Atlas.'
        });
    }

    try {
        const query = { organization: req.user.organization };
        const rpmAggregation = await Log.aggregate([
            {
                $match: {
                    ...query,
                    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const rpmData = Array(24).fill(0);
        rpmAggregation.forEach(item => {
            rpmData[item._id] = item.count;
        });

        const originStats = await Log.aggregate([
            { $match: query },
            { $group: { _id: "$origin", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const totalLogs = await Log.countDocuments(query);
        const blockedLogs = await Log.countDocuments({ ...query, status: { $ne: 'Allowed' } });
        const distinctOrigins = await Log.distinct('origin', query);

        const summary = {
            activeOrigins: distinctOrigins.length,
            blockPercentage: totalLogs > 0 ? ((blockedLogs / totalLogs) * 100).toFixed(2) : '0.00',
            peakRpm: (Math.max(...rpmData) / 60).toFixed(2) // Average RPM in the peak hour
        };

        res.json({
            originStats,
            rpmData,
            summary
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
