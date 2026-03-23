const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);
router.get('/invite/verify/:token', authController.verifyInviteToken);

module.exports = router;
