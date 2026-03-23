const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, settingsController.getProfile);
router.put('/profile', protect, settingsController.updateProfile);
router.get('/team', protect, settingsController.getTeam);
router.post('/team/invite', protect, settingsController.inviteMember);
router.post('/team/invite-link', protect, settingsController.generateInviteLink);
router.delete('/team/:id', protect, settingsController.removeMember);

module.exports = router;
