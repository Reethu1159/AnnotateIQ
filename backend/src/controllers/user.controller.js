const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatarColor: true,
        createdAt: true,
        assignedTasks: {
          select: { id: true, status: true, dueDate: true, completedAt: true }
        },
        projectMemberships: {
          include: { project: { select: { id: true, name: true } } }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatarColor: true,
        bio: true,
        githubLink: true,
        linkedinLink: true,
        createdAt: true,
        assignedTasks: {
          include: { project: { select: { id: true, name: true } } }
        },
        projectMemberships: {
          include: { project: { select: { id: true, name: true, domain: true } } }
        }
      }
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getUsers, getUserById };
