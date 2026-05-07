const { body, param, validationResult } = require('express-validator');

const PROJECT_DOMAINS = ['Medical', 'Legal', 'Finance', 'Coding', 'General'];
const USER_ROLES = ['ADMIN', 'MEMBER'];
const PROJECT_ROLES = ['OWNER', 'ADMIN', 'QUALITY_LEAD', 'MEMBER'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TASK_STATUSES = ['TODO', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DONE'];
const TASK_TYPES = ['ANNOTATION', 'EVALUATION', 'DATA_OPS', 'PROMPT_ENGINEERING', 'QA'];

const optionalNullable = { nullable: true, checkFalsy: true };

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

const isFutureDate = (value) => {
  if (!value) return true;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

const projectIdParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage('Project id is required'),
];

const userIdParam = (paramName = 'userId') => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage('User id is required'),
];

const taskIdParam = (paramName = 'id') => [
  param(paramName)
    .trim()
    .notEmpty()
    .withMessage('Task id is required'),
];

const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('phone')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone must be 30 characters or fewer'),
  body('dob')
    .optional(optionalNullable)
    .isISO8601()
    .withMessage('DOB must be a valid date'),
  body('gender')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 30 })
    .withMessage('Gender must be 30 characters or fewer'),
  body('department')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 80 })
    .withMessage('Department must be 80 characters or fewer'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage('Username must be between 3 and 40 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only include letters, numbers, dots, underscores, and hyphens'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must include at least one number'),
  body('role')
    .optional(optionalNullable)
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
  body('avatarColor')
    .optional(optionalNullable)
    .trim()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage('Avatar color must be a valid hex color'),
  body('bio')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be 500 characters or fewer'),
  body('githubLink')
    .optional(optionalNullable)
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('GitHub link must be a valid URL'),
  body('linkedinLink')
    .optional(optionalNullable)
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('LinkedIn link must be a valid URL'),
  handleValidationErrors,
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or fewer'),
  body('domain')
    .optional(optionalNullable)
    .isIn(PROJECT_DOMAINS)
    .withMessage(`Domain must be one of: ${PROJECT_DOMAINS.join(', ')}`),
  body('deadline')
    .optional(optionalNullable)
    .custom(isFutureDate)
    .withMessage('Deadline must be a future date'),
  body('taskQuota')
    .optional(optionalNullable)
    .isInt({ min: 1 })
    .withMessage('Task quota must be a positive integer')
    .toInt(),
  handleValidationErrors,
];

const updateProjectValidation = [
  ...projectIdParam(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or fewer'),
  body('domain')
    .optional(optionalNullable)
    .isIn(PROJECT_DOMAINS)
    .withMessage(`Domain must be one of: ${PROJECT_DOMAINS.join(', ')}`),
  body('deadline')
    .optional(optionalNullable)
    .custom(isFutureDate)
    .withMessage('Deadline must be a future date'),
  body('taskQuota')
    .optional(optionalNullable)
    .isInt({ min: 1 })
    .withMessage('Task quota must be a positive integer')
    .toInt(),
  handleValidationErrors,
];

const addProjectMemberValidation = [
  ...projectIdParam(),
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('User id is required'),
  body('role')
    .optional(optionalNullable)
    .isIn(PROJECT_ROLES)
    .withMessage(`Project role must be one of: ${PROJECT_ROLES.join(', ')}`),
  handleValidationErrors,
];

const projectParamValidation = [
  ...projectIdParam(),
  handleValidationErrors,
];

const projectTasksParamValidation = [
  ...projectIdParam('projectId'),
  handleValidationErrors,
];

const removeProjectMemberValidation = [
  ...projectIdParam(),
  ...userIdParam(),
  handleValidationErrors,
];

const taskFieldsValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters'),
  body('description')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be 2000 characters or fewer'),
  body('type')
    .optional(optionalNullable)
    .isIn(TASK_TYPES)
    .withMessage(`Task type must be one of: ${TASK_TYPES.join(', ')}`),
  body('priority')
    .optional(optionalNullable)
    .isIn(TASK_PRIORITIES)
    .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional(optionalNullable)
    .custom(isFutureDate)
    .withMessage('Due date must be a future date'),
  body('estimatedHours')
    .optional(optionalNullable)
    .isFloat({ min: 0.1 })
    .withMessage('Estimated hours must be a positive number')
    .toFloat(),
  body('guidelinesUrl')
    .optional(optionalNullable)
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Guidelines URL must be a valid URL'),
  body('assigneeId')
    .optional(optionalNullable)
    .trim()
    .notEmpty()
    .withMessage('Assignee id cannot be empty'),
];

const createTaskValidation = [
  ...projectIdParam('projectId'),
  ...taskFieldsValidation,
  handleValidationErrors,
];

const batchCreateTasksValidation = [
  ...projectIdParam('projectId'),
  body('tasks')
    .isArray({ min: 1, max: 100 })
    .withMessage('Tasks must be a non-empty array with at most 100 items'),
  body('tasks.*.title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Each task title must be between 3 and 200 characters'),
  body('tasks.*.description')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Each description must be 2000 characters or fewer'),
  body('tasks.*.type')
    .optional(optionalNullable)
    .isIn(TASK_TYPES)
    .withMessage(`Each task type must be one of: ${TASK_TYPES.join(', ')}`),
  body('tasks.*.priority')
    .optional(optionalNullable)
    .isIn(TASK_PRIORITIES)
    .withMessage(`Each priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('tasks.*.dueDate')
    .optional(optionalNullable)
    .custom(isFutureDate)
    .withMessage('Each due date must be a future date'),
  body('tasks.*.estimatedHours')
    .optional(optionalNullable)
    .isFloat({ min: 0.1 })
    .withMessage('Each estimated hours value must be positive')
    .toFloat(),
  body('tasks.*.guidelinesUrl')
    .optional(optionalNullable)
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Each guidelines URL must be valid'),
  body('tasks.*.assigneeId')
    .optional(optionalNullable)
    .trim()
    .notEmpty()
    .withMessage('Each assignee id cannot be empty'),
  handleValidationErrors,
];

const updateTaskValidation = [
  ...taskIdParam(),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters'),
  body('description')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be 2000 characters or fewer'),
  body('type')
    .optional(optionalNullable)
    .isIn(TASK_TYPES)
    .withMessage(`Task type must be one of: ${TASK_TYPES.join(', ')}`),
  body('priority')
    .optional(optionalNullable)
    .isIn(TASK_PRIORITIES)
    .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional(optionalNullable)
    .custom(isFutureDate)
    .withMessage('Due date must be a future date'),
  body('estimatedHours')
    .optional(optionalNullable)
    .isFloat({ min: 0.1 })
    .withMessage('Estimated hours must be a positive number')
    .toFloat(),
  body('guidelinesUrl')
    .optional(optionalNullable)
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Guidelines URL must be a valid URL'),
  handleValidationErrors,
];

const taskParamValidation = [
  ...taskIdParam(),
  handleValidationErrors,
];

const assignTaskValidation = [
  ...taskIdParam(),
  body('assigneeId')
    .trim()
    .notEmpty()
    .withMessage('Assignee id is required'),
  handleValidationErrors,
];

const updateTaskStatusValidation = [
  ...taskIdParam(),
  body('status')
    .isIn(TASK_STATUSES)
    .withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('submissionNotes')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Submission notes must be 2000 characters or fewer'),
  body('reviewFeedback')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review feedback must be 2000 characters or fewer'),
  handleValidationErrors,
];

const clarifyTaskValidation = [
  ...taskIdParam(),
  body('note')
    .optional(optionalNullable)
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Clarification note must be 1000 characters or fewer'),
  handleValidationErrors,
];

module.exports = {
  PROJECT_DOMAINS,
  PROJECT_ROLES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  USER_ROLES,
  addProjectMemberValidation,
  assignTaskValidation,
  batchCreateTasksValidation,
  clarifyTaskValidation,
  createProjectValidation,
  createTaskValidation,
  handleValidationErrors,
  loginValidation,
  projectParamValidation,
  projectTasksParamValidation,
  removeProjectMemberValidation,
  signupValidation,
  taskParamValidation,
  updateTaskStatusValidation,
  updateTaskValidation,
  updateProjectValidation,
};
