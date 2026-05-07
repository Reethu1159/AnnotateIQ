const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.patch('/read', protect, markNotificationsRead);

module.exports = router;
