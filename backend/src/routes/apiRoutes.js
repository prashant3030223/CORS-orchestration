const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, apiController.getApis);
router.post('/', protect, apiController.createApi);
router.put('/:id', protect, apiController.updateApi);
router.delete('/:id', protect, apiController.deleteApi);

module.exports = router;
