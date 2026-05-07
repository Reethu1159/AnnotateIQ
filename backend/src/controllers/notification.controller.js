const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OPEN_STATUSES = ['TODO', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED'];

const createDeadlineNotifications = async (userId) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const dueTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      dueDate: {
        gte: new Date(),
        lte: tomorrow,
      },
      status: {
        in: OPEN_STATUSES,
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  for (const task of dueTasks) {
    const message = `Deadline within 24h: ${task.title}`;
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        message,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: { userId, message },
      });
    }
  }
};

const getNotifications = async (req, res) => {
  try {
    await createDeadlineNotifications(req.user.id);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markNotificationsRead };
