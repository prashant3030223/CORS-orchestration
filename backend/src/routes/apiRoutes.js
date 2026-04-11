const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

const { protect } = require('../middleware/authMiddleware');

// Get all APIs for logged-in user
router.get('/', protect, apiController.getApis);
// Create new API entry
router.post('/', protect, apiController.createApi);
// Update API by ID
router.put('/:id', protect, apiController.updateApi);
// Delete API by ID
router.delete('/:id', protect, apiController.deleteApi);

module.exports = router;
