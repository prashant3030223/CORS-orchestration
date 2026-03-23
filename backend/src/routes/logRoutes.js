const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', logController.getLogs);
router.post('/', logController.createLog);
router.delete('/clear', logController.clearLogs);

module.exports = router;
