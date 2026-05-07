const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const getProjectIdFromRequest = (req) => req.params.projectId || req.params.id;

const projectRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    const projectId = getProjectIdFromRequest(req);

    if (!projectId) {
      return res.status(400).json({ message: 'Project id is required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role === 'ADMIN') {
      req.projectMembership = { projectId, role: 'GLOBAL_ADMIN' };
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Project access denied' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      return res.status(403).json({ message: 'Insufficient project permissions' });
    }

    req.projectMembership = membership;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { admin, projectRole };
