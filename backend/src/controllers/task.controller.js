const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MANAGER_ROLES = ['OWNER', 'ADMIN'];
const REVIEWER_ROLES = ['OWNER', 'ADMIN', 'QUALITY_LEAD'];

const taskInclude = {
  project: {
    include: {
      members: true,
    },
  },
  assignee: {
    select: { id: true, name: true, email: true, avatarColor: true },
  },
  creator: {
    select: { id: true, name: true, email: true, avatarColor: true },
  },
  activities: {
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, avatarColor: true } },
    },
  },
};

const statusTransitions = {
  TODO: ['ACCEPTED'],
  ACCEPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['DONE'],
  REJECTED: ['ACCEPTED', 'UNDER_REVIEW'],
  DONE: [],
};

const getMembership = (task, userId) => task.project.members.find((member) => member.userId === userId);

const isGlobalAdmin = (req) => req.user.role === 'ADMIN';

const canManageTask = (req, task) => {
  if (isGlobalAdmin(req)) return true;
  const membership = getMembership(task, req.user.id);
  return membership && MANAGER_ROLES.includes(membership.role);
};

const canReviewTask = (req, task) => {
  if (isGlobalAdmin(req)) return true;
  const membership = getMembership(task, req.user.id);
  return membership && REVIEWER_ROLES.includes(membership.role);
};

const canAccessTask = (req, task) => {
  if (canManageTask(req, task) || canReviewTask(req, task)) return true;
  return Boolean(getMembership(task, req.user.id));
};

const canWorkTask = (req, task) => {
  if (canManageTask(req, task)) return true;
  return task.assigneeId === req.user.id || (!task.assigneeId && Boolean(getMembership(task, req.user.id)));
};

const getTaskOr404 = async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: taskInclude,
  });

  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return null;
  }

  if (req.params.projectId && task.projectId !== req.params.projectId) {
    res.status(404).json({ message: 'Task not found in this project' });
    return null;
  }

  return task;
};

const ensureProjectMember = async (projectId, userId) => {
  if (!userId) return true;

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });

  return Boolean(member);
};

const createAssignmentNotification = async (task, assigneeId) => {
  if (!assigneeId) return;

  await prisma.notification.create({
    data: {
      userId: assigneeId,
      message: `New task assigned: ${task.title}`,
    },
  });
};

const serializeTaskData = (body) => {
  const allowedFields = [
    'title',
    'description',
    'type',
    'priority',
    'dueDate',
    'estimatedHours',
    'guidelinesUrl',
  ];

  return allowedFields.reduce((data, field) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return data;
    }

    if (['type', 'priority'].includes(field) && !body[field]) {
      return data;
    }

    data[field] = field === 'dueDate' && body.dueDate ? new Date(body.dueDate) : body[field] || null;
    return data;
  }, {});
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { assigneeId } = req.body;

    if (assigneeId && !(await ensureProjectMember(projectId, assigneeId))) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const task = await prisma.task.create({
      data: {
        ...serializeTaskData(req.body),
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: taskInclude,
    });

    await prisma.taskActivity.create({
      data: { taskId: task.id, userId: req.user.id, action: 'created' },
    });

    if (assigneeId) {
      await prisma.taskActivity.create({
        data: { taskId: task.id, userId: req.user.id, action: 'assigned', note: `Assigned to user ${assigneeId}` },
      });
      await createAssignmentNotification(task, assigneeId);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const batchCreateTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tasks } = req.body;

    const assigneeIds = [...new Set(tasks.map((task) => task.assigneeId).filter(Boolean))];
    const memberships = await prisma.projectMember.findMany({
      where: { projectId, userId: { in: assigneeIds } },
      select: { userId: true },
    });
    const projectMemberIds = new Set(memberships.map((member) => member.userId));
    const invalidAssignee = assigneeIds.find((assigneeId) => !projectMemberIds.has(assigneeId));

    if (invalidAssignee) {
      return res.status(400).json({ message: 'Every assignee must be a project member' });
    }

    const createdTasks = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const taskInput of tasks) {
        const task = await tx.task.create({
          data: {
            ...serializeTaskData(taskInput),
            projectId,
            assigneeId: taskInput.assigneeId || null,
            creatorId: req.user.id,
          },
        });

        await tx.taskActivity.create({
          data: { taskId: task.id, userId: req.user.id, action: 'created' },
        });

        if (taskInput.assigneeId) {
          await tx.taskActivity.create({
            data: {
              taskId: task.id,
              userId: req.user.id,
              action: 'assigned',
              note: `Assigned to user ${taskInput.assigneeId}`,
            },
          });
          await tx.notification.create({
            data: {
              userId: taskInput.assigneeId,
              message: `New task assigned: ${task.title}`,
            },
          });
        }

        created.push(task);
      }

      return created;
    });

    res.status(201).json(createdTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const where = { projectId };

    if (!isGlobalAdmin(req) && !MANAGER_ROLES.includes(req.projectMembership?.role) && !REVIEWER_ROLES.includes(req.projectMembership?.role)) {
      where.OR = [
        { assigneeId: req.user.id },
        { assigneeId: null },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        project: { select: { id: true, name: true, domain: true } },
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await getTaskOr404(req, res);
    if (!task) return;

    if (!canAccessTask(req, task)) {
      return res.status(403).json({ message: 'Task access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await getTaskOr404(req, res);
    if (!task) return;

    if (!canManageTask(req, task)) {
      return res.status(403).json({ message: 'Insufficient task permissions' });
    }

    const data = serializeTaskData(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No valid task fields provided' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data,
      include: taskInclude,
    });

    await prisma.taskActivity.create({
      data: { taskId: task.id, userId: req.user.id, action: 'updated' },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await getTaskOr404(req, res);
    if (!task) return;

    if (!canManageTask(req, task)) {
      return res.status(403).json({ message: 'Insufficient task permissions' });
    }

    await prisma.task.delete({ where: { id: task.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignTask = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const task = await getTaskOr404(req, res);
    if (!task) return;

    if (!canManageTask(req, task)) {
      return res.status(403).json({ message: 'Insufficient task permissions' });
    }

    if (!(await ensureProjectMember(task.projectId, assigneeId))) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { assigneeId },
      include: taskInclude,
    });

    await prisma.taskActivity.create({
      data: { taskId: task.id, userId: req.user.id, action: 'assigned', note: `Assigned to user ${assigneeId}` },
    });
    await createAssignmentNotification(task, assigneeId);

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStatusUpdateData = (task, requestedStatus, req) => {
  const allowedNextStatuses = statusTransitions[task.status] || [];

  if (!allowedNextStatuses.includes(requestedStatus)) {
    return {
      error: `Invalid status transition from ${task.status} to ${requestedStatus}`,
    };
  }

  const updateData = { status: requestedStatus };
  const activity = { action: `status changed to ${requestedStatus}` };

  if (requestedStatus === 'ACCEPTED') {
    if (!canWorkTask(req, task)) {
      return { error: 'Only the assignee or a project manager can accept this task' };
    }
    updateData.acceptedAt = new Date();
    updateData.assigneeId = task.assigneeId || req.user.id;
    updateData.clarificationRequested = false;
    activity.action = 'accepted';
  }

  if (requestedStatus === 'IN_PROGRESS') {
    if (!canWorkTask(req, task)) {
      return { error: 'Only the assignee or a project manager can start this task' };
    }
    activity.action = 'started';
  }

  if (requestedStatus === 'SUBMITTED') {
    if (!canWorkTask(req, task)) {
      return { error: 'Only the assignee or a project manager can submit this task' };
    }
    updateData.status = 'UNDER_REVIEW';
    updateData.submittedAt = new Date();
    updateData.submissionNotes = req.body.submissionNotes || null;
    activity.action = 'submitted';
    activity.note = req.body.submissionNotes;
  }

  if (requestedStatus === 'APPROVED') {
    if (!canReviewTask(req, task)) {
      return { error: 'Only a project reviewer can approve this task' };
    }
    updateData.completedAt = new Date();
    updateData.reviewFeedback = req.body.reviewFeedback || null;
    activity.action = 'approved';
    activity.note = req.body.reviewFeedback;
  }

  if (requestedStatus === 'REJECTED') {
    if (!canReviewTask(req, task)) {
      return { error: 'Only a project reviewer can reject this task' };
    }
    updateData.reviewFeedback = req.body.reviewFeedback || null;
    updateData.clarificationRequested = false;
    activity.action = 'rejected';
    activity.note = req.body.reviewFeedback;
  }

  if (requestedStatus === 'DONE') {
    if (!canReviewTask(req, task)) {
      return { error: 'Only a project reviewer can close this task' };
    }
    updateData.completedAt = task.completedAt || new Date();
    activity.action = 'completed';
  }

  return { updateData, activity };
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await getTaskOr404(req, res);
    if (!task) return;

    const { updateData, activity, error } = getStatusUpdateData(task, status, req);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: updateData,
      include: taskInclude,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: req.user.id,
        action: activity.action,
        note: activity.note,
      },
    });

    if (status === 'REJECTED' && task.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          message: `Task needs rework: ${task.title}`,
        },
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const requestClarification = async (req, res) => {
  try {
    const task = await getTaskOr404(req, res);
    if (!task) return;

    if (!canWorkTask(req, task)) {
      return res.status(403).json({ message: 'Only the assignee can request clarification' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { clarificationRequested: true },
      include: taskInclude,
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: req.user.id,
        action: 'clarification_requested',
        note: req.body.note,
      },
    });

    const reviewerIds = task.project.members
      .filter((member) => REVIEWER_ROLES.includes(member.role))
      .map((member) => member.userId);

    if (reviewerIds.length > 0) {
      await prisma.notification.createMany({
        data: reviewerIds.map((userId) => ({
          userId,
          message: `Clarification requested on task: ${task.title}`,
        })),
        skipDuplicates: true,
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  assignTask,
  batchCreateTasks,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  requestClarification,
  updateTask,
  updateTaskStatus,
};
