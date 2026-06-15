import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// Dashboard: stats for the member
export const getDashboard = async (req, res) => {
  try {
    const { memberId } = req.user;
    if (!memberId) return res.status(403).json({ status: 'fail', message: 'User is not linked to a member profile' });

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        attendanceRecords: {
          include: { session: true },
          orderBy: { createdAt: 'desc' }
        },
        officers: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ status: 'fail', message: 'Member not found' });
    }

    const stats = {
      present: member.attendanceRecords.filter(r => r.status === 'PRESENT').length,
      absent: member.attendanceRecords.filter(r => r.status === 'ABSENT').length,
      late: member.attendanceRecords.filter(r => r.status === 'LATE').length,
      excused: member.attendanceRecords.filter(r => r.status === 'EXCUSED').length,
    };

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        member: {
          id: member.id,
          fullName: member.fullName,
          voiceType: member.voiceType,
          status: member.status,
          officer: member.officers.length > 0 ? member.officers[0] : null
        },
        recentAttendance: member.attendanceRecords.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Portal Dashboard Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Attendance records
export const getAttendance = async (req, res) => {
  try {
    const { memberId } = req.user;
    if (!memberId) return res.status(403).json({ status: 'fail', message: 'User is not linked to a member profile' });

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { memberId },
      include: { session: { include: { semester: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { attendance: attendanceRecords } });
  } catch (error) {
    console.error('Portal Attendance Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Profile details
export const getProfile = async (req, res) => {
  try {
    const { memberId } = req.user;
    if (!memberId) return res.status(403).json({ status: 'fail', message: 'User is not linked to a member profile' });

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        officers: { where: { status: 'ACTIVE' } },
        user: { select: { username: true } }
      }
    });

    res.status(200).json({ status: 'success', data: { profile: member } });
  } catch (error) {
    console.error('Portal Profile Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Semester attendance summary
export const getSemesterSummary = async (req, res) => {
  try {
    const { memberId } = req.user;
    if (!memberId) return res.status(403).json({ status: 'fail', message: 'User is not linked to a member profile' });

    const semesters = await prisma.semester.findMany({
      include: {
        sessions: {
          include: {
            attendance: {
              where: { memberId }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const summary = semesters
      .filter(sem => sem.sessions.some(s => s.attendance.length > 0))
      .map(sem => {
        const records = sem.sessions.flatMap(s => s.attendance);
        const totalSessions = sem.sessions.length;
        const present = records.filter(r => r.status === 'PRESENT').length;
        const absent  = records.filter(r => r.status === 'ABSENT').length;
        const late    = records.filter(r => r.status === 'LATE').length;
        const excused = records.filter(r => r.status === 'EXCUSED').length;
        const recorded = records.length;
        const attendanceRate = recorded > 0 ? Math.round((present / recorded) * 100) : 0;

        return {
          id: sem.id,
          name: sem.name,
          startDate: sem.startDate,
          endDate: sem.endDate,
          notes: sem.notes,
          totalSessions,
          recorded,
          present,
          absent,
          late,
          excused,
          attendanceRate
        };
      });

    res.status(200).json({ status: 'success', data: { semesters: summary } });
  } catch (error) {
    console.error('Portal Semester Summary Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Update profile credentials
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user; // Update the authenticated user's own credentials
    const { username, password, currentPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ status: 'fail', message: 'Current password required to set new password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ status: 'fail', message: 'Incorrect current password' });
      }
    }

    const data = {};
    if (username) {
      // check if username taken
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ status: 'fail', message: 'Username is already taken' });
      }
      data.username = username;
    }
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    res.status(200).json({ status: 'success', message: 'Profile updated' });
  } catch (error) {
    console.error('Portal Update Profile Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
