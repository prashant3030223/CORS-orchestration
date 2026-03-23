// This utility provides mock data and simulated responses when the database is offline.
const mockData = {
    users: [
        {
            _id: 'mock-user-1',
            name: 'Prashant Yadav',
            email: 'prashant@enterprise.io',
            password: '$2a$10$SomethingSecret', // In real life, we don't mock passwords easily, but for dev we can bypass
            role: 'Global Admin',
            organization: 'mock-org-1',
            avatar: 'PY'
        }
    ],
    apis: [
        { _id: 'api-1', name: 'Identity Service', url: 'https://auth.corsguard.io', status: 'Active', organization: 'mock-org-1' },
        { _id: 'api-2', name: 'Payment Gateway', url: 'https://pay.corsguard.io', status: 'Security Warning', organization: 'mock-org-1' }
    ],
    logs: [
        { timestamp: new Date(), origin: 'http://localhost:5173', status: 'Allowed', method: 'GET', apiEndpoint: '/users' },
        { timestamp: new Date(), origin: 'http://malicious.com', status: 'Blocked', method: 'POST', apiEndpoint: '/login' }
    ]
};

const getMockUser = (email) => {
    return mockData.users.find(u => u.email === email);
};

const getMockDashboardStats = () => {
    return {
        counts: { apis: mockData.apis.length, requests: mockData.logs.length, allowed: 1, blocked: 1 },
        policyDistribution: { Allowed: 1, Blocked: 1, Modified: 0 },
        trafficData: { labels: ['Today'], data: [mockData.logs.length] },
        recentActivity: mockData.logs
    };
};

module.exports = { mockData, getMockUser, getMockDashboardStats };
