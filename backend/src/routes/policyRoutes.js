const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

const { protect } = require('../middleware/authMiddleware');

router.get('/:apiId', protect, policyController.getPolicyByApiId);
router.post('/update', protect, policyController.updatePolicy);

module.exports = router;
