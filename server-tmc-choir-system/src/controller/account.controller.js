import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// Get all accounts
export const getAccounts = async (req, res) => {
  try {
    // 1. All members with their linked user account (if any)
    const members = await prisma.member.findMany({
      include: { user: true },
      orderBy: { fullName: 'asc' },
    });

    // 2. Standalone users that are NOT linked to any member (e.g. pure admin accounts)
    const standaloneUsers = await prisma.user.findMany({
      where: { memberId: null },
      orderBy: { createdAt: 'desc' },
    });

    // Build member rows — either a real account or a "No Account" placeholder
    const memberAccounts = members.map((m) => {
      const { user, ...memberData } = m;
      if (user) {
        const { passwordHash, ...safeUser } = user;
        return { ...safeUser, member: memberData };
      }
      // Member exists but has no linked user yet
      return {
        id: null,
        username: null,
        role: 'member',
        isActive: false,
        memberId: m.id,
        member: memberData,
        hasAccount: false,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });

    // Build standalone admin/non-member rows
    const adminAccounts = standaloneUsers.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    // Standalone admins first, then all member rows (with or without accounts)
    res.status(200).json({
      status: 'success',
      data: { accounts: [...adminAccounts, ...memberAccounts] },
    });
  } catch (error) {
    console.error('Get Accounts Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Create an account for an existing member that has none
export const createAccountForMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const member = await prisma.member.findUnique({
      where: { id: parseInt(memberId) },
      include: { user: true },
    });

    if (!member) return res.status(404).json({ status: 'fail', message: 'Member not found' });
    if (member.user) return res.status(400).json({ status: 'fail', message: 'Member already has an account' });

    const baseUsername = member.fullName.toLowerCase().replace(/\s+/g, '.');
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const passwordHash = await bcrypt.hash('tmc2026', 10);
    const newUser = await prisma.user.create({
      data: { username, passwordHash, role: 'member', memberId: member.id },
      include: { member: true },
    });

    const { passwordHash: ph, ...safeUser } = newUser;
    res.status(201).json({ status: 'success', data: { account: safeUser } });
  } catch (error) {
    console.error('Create Account For Member Error:', error);
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
