const express = require('express');
const router = express.Router();
const { getUsers, getUserById } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { admin } = require('../middleware/role.middleware');

router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUserById);

module.exports = router;
