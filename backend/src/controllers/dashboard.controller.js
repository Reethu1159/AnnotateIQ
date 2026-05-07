const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OPEN_STATUSES = ['TODO', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED'];

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getAdminDashboard = async () => {
  const now = new Date();

  const [
    totalProjects,
    totalTasks,
    overdueTasks,
    teamCount,
    recentTasks,
    activityFeed,
    users,
    taskDistribution,
  ] = await Promise.all([
    prisma.project.count({ where: { archived: false } }),
    prisma.task.count(),
    prisma.task.count({
      where: {
        dueDate: { lt: now },
        status: { in: OPEN_STATUSES },
      },
    }),
    prisma.user.count(),
    prisma.task.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarColor: true } },
      },
    }),
    prisma.taskActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
        task: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        name: true,
        avatarColor: true,
        assignedTasks: {
          select: { status: true, completedAt: true },
        },
      },
    }),
    prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const topPerformers = users
    .map((user) => {
      const completed = user.assignedTasks.filter((task) => ['APPROVED', 'DONE'].includes(task.status)).length;
      return {
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        completed,
        assigned: user.assignedTasks.length,
      };
    })
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  return {
    role: 'ADMIN',
    stats: {
      totalProjects,
      totalTasks,
      overdueTasks,
      teamCount,
    },
    recentTasks,
    taskDistribution,
    topPerformers,
    activityFeed,
  };
};

const getMemberDashboard = async (userId) => {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [
    assignedTasks,
    completedThisWeek,
    overdue,
    upcomingTasks,
    recentFeedback,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: OPEN_STATUSES },
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        completedAt: { gte: startOfWeek() },
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        dueDate: { lt: now },
        status: { in: OPEN_STATUSES },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: { gte: now, lte: nextWeek },
        status: { in: OPEN_STATUSES },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        project: { select: { id: true, name: true, domain: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        reviewFeedback: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        reviewFeedback: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    role: 'MEMBER',
    stats: {
      assignedTasks,
      completedThisWeek,
      overdue,
    },
    upcomingTasks,
    recentFeedback,
  };
};

const getDashboard = async (req, res) => {
  try {
    const dashboard = req.user.role === 'ADMIN'
      ? await getAdminDashboard()
      : await getMemberDashboard(req.user.id);

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const exportDashboardCsv = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { name: true, domain: true } },
        assignee: { select: { name: true, email: true } },
        creator: { select: { name: true, email: true } },
      },
    });

    const headers = [
      'Task ID',
      'Title',
      'Project',
      'Domain',
      'Assignee',
      'Assignee Email',
      'Creator',
      'Status',
      'Priority',
      'Type',
      'Due Date',
      'Estimated Hours',
      'Created At',
      'Completed At',
    ];

    const rows = tasks.map((task) => [
      task.id,
      task.title,
      task.project.name,
      task.project.domain,
      task.assignee?.name,
      task.assignee?.email,
      task.creator.name,
      task.status,
      task.priority,
      task.type,
      task.dueDate?.toISOString(),
      task.estimatedHours,
      task.createdAt.toISOString(),
      task.completedAt?.toISOString(),
    ]);

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('annotateiq-tasks.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { exportDashboardCsv, getDashboard };
