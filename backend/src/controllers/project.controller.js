const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const projectSelect = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarColor: true,
          department: true,
        },
      },
    },
  },
  tasks: {
    include: {
      assignee: {
        select: { id: true, name: true, avatarColor: true },
      },
    },
  },
};

const getWhitelistedProjectUpdates = (body) => {
  const allowedFields = ['name', 'description', 'domain', 'deadline', 'taskQuota'];

  return allowedFields.reduce((updates, field) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      return updates;
    }

    if (field === 'deadline') {
      updates.deadline = body.deadline ? new Date(body.deadline) : null;
      return updates;
    }

    updates[field] = body[field];
    return updates;
  }, {});
};

const createProject = async (req, res) => {
  try {
    const { name, description, domain, deadline, taskQuota } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        domain,
        deadline: deadline ? new Date(deadline) : null,
        taskQuota,
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        }
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: req.user.role === 'ADMIN' ? {} : {
        members: {
          some: { userId: req.user.id }
        }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
        _count: { select: { tasks: true } }
      }
    });
    
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: projectSelect
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = getWhitelistedProjectUpdates(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No valid project fields provided' });
    }
    
    const project = await prisma.project.update({
      where: { id },
      data
    });
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.update({
      where: { id },
      data: { archived: true },
    });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { userId, role = 'MEMBER' } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({ message: 'User is already a project member' });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId,
        projectId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
            department: true,
          },
        },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: 'Project member not found' });
    }

    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last project owner' });
      }
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    res.json({ message: 'Project member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addMember,
  archiveProject,
  createProject,
  deleteProject,
  getProjects,
  getProjectById,
  removeMember,
  updateProject,
};
