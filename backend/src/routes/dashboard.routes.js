const express = require('express');
const router = express.Router();
const { exportDashboardCsv, getDashboard } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { admin } = require('../middleware/role.middleware');

router.get('/', protect, getDashboard);
router.get('/export', protect, admin, exportDashboardCsv);

module.exports = router;
