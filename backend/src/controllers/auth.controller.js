const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { generateToken, clearToken } = require('../utils/jwt.utils');

const prisma = new PrismaClient();

const signup = async (req, res) => {
  try {
    const {
      name, email, phone, dob, gender, department,
      username, password, role, avatarColor, bio, githubLink, linkedinLink
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (signup always creates MEMBER, ADMIN role set by system only)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        dob: dob ? new Date(dob) : null,
        gender,
        department,
        username,
        password: hashedPassword,
        role: 'MEMBER',
        avatarColor,
        bio,
        githubLink,
        linkedinLink
      }
    });

    if (user) {
      generateToken(res, user.id, user.role);
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarColor: user.avatarColor
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      generateToken(res, user.id, user.role);
      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarColor: user.avatarColor
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const logout = (req, res) => {
  clearToken(res);
  res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        avatarColor: true,
        department: true,
        bio: true,
        phone: true,
        dob: true,
        gender: true,
        githubLink: true,
        linkedinLink: true,
        createdAt: true
      }
    });

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe
};
