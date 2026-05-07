const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  assignTask,
  batchCreateTasks,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  requestClarification,
  updateTask,
  updateTaskStatus,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { projectRole } = require('../middleware/role.middleware');
const {
  assignTaskValidation,
  batchCreateTasksValidation,
  clarifyTaskValidation,
  createTaskValidation,
  projectTasksParamValidation,
  taskParamValidation,
  updateTaskStatusValidation,
  updateTaskValidation,
} = require('../utils/validators');

// Routes mapped relative to /api/projects/:projectId/tasks
router.route('/')
  .get(protect, projectTasksParamValidation, projectRole(['OWNER', 'ADMIN', 'QUALITY_LEAD', 'MEMBER']), getTasks)
  .post(protect, createTaskValidation, projectRole(['OWNER', 'ADMIN']), createTask);

router.post(
  '/batch',
  protect,
  batchCreateTasksValidation,
  projectRole(['OWNER', 'ADMIN']),
  batchCreateTasks
);

// Routes mapped relative to both /api/projects/:projectId/tasks and /api/tasks
// When used via /api/tasks/:id (not nested), projectRole middleware must be applied in controller
router.route('/:id')
  .get(protect, taskParamValidation, getTaskById)
  .patch(protect, updateTaskValidation, updateTask)
  .delete(protect, taskParamValidation, deleteTask);

router.patch('/:id/status', protect, updateTaskStatusValidation, updateTaskStatus);
router.patch('/:id/assign', protect, assignTaskValidation, assignTask);
router.post('/:id/clarify', protect, clarifyTaskValidation, requestClarification);

module.exports = router;
