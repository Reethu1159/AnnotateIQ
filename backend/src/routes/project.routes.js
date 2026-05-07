const express = require('express');
const router = express.Router();
const {
  addMember,
  archiveProject,
  createProject,
  deleteProject,
  getProjects,
  getProjectById,
  removeMember,
  updateProject,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { admin, projectRole } = require('../middleware/role.middleware');
const {
  addProjectMemberValidation,
  createProjectValidation,
  projectParamValidation,
  removeProjectMemberValidation,
  updateProjectValidation,
} = require('../utils/validators');

router.route('/')
  .get(protect, getProjects)
  .post(protect, admin, createProjectValidation, createProject);

router.patch(
  '/:id/archive',
  protect,
  projectParamValidation,
  projectRole(['OWNER']),
  archiveProject
);

router.post(
  '/:id/members',
  protect,
  addProjectMemberValidation,
  projectRole(['OWNER', 'ADMIN']),
  addMember
);

router.delete(
  '/:id/members/:userId',
  protect,
  removeProjectMemberValidation,
  projectRole(['OWNER', 'ADMIN']),
  removeMember
);

router.route('/:id')
  .get(protect, projectParamValidation, projectRole(['OWNER', 'ADMIN', 'QUALITY_LEAD', 'MEMBER']), getProjectById)
  .patch(protect, updateProjectValidation, projectRole(['OWNER', 'ADMIN']), updateProject)
  .delete(protect, projectParamValidation, projectRole(['OWNER']), deleteProject);

module.exports = router;
