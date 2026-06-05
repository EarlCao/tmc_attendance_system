import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// Get all accounts
export const getAccounts = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { member: true },
      orderBy: { createdAt: 'desc' },
    });
    
    // Remove passwordHash from response
    const safeUsers = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.status(200).json({ status: 'success', data: { accounts: safeUsers } });
  } catch (error) {
    console.error('Get Accounts Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Create an account manually
export const createAccount = async (req, res) => {
  try {
    const { username, password, role, isActive, memberId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ status: 'fail', message: 'Username and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role || 'admin',
        isActive: isActive !== undefined ? isActive : true,
        memberId: memberId || null,
      },
      include: { member: true }
    });

    const { passwordHash: ph, ...safeUser } = newUser;
    res.status(201).json({ status: 'success', data: { account: safeUser } });
  } catch (error) {
    console.error('Create Account Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Update an account
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, currentPassword, role, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existingUser) {
      return res.status(404).json({ status: 'fail', message: 'Account not found' });
    }

    if (password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ status: 'fail', message: 'Incorrect current password' });
      }
    }

    const data = {};
    if (username) data.username = username;
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: { member: true }
    });

    const { passwordHash: ph, ...safeUser } = updatedUser;
    res.status(200).json({ status: 'success', data: { account: safeUser } });
  } catch (error) {
    console.error('Update Account Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Delete an account
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
