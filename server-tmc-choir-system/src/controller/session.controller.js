import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/security.js';

// Normalize a session for frontend consumption
const formatSession = (session, counts = {}) => ({
  ...session,
  // Alias fields to what the frontend expects
  date: session.sessionDate,
  notes: session.description || '',
  counts: {
    Present: counts.Present || 0,
    Late:    counts.Late    || 0,
    Absent:  counts.Absent  || 0,
    Excused: counts.Excused || 0,
  },
});

export const getSessions = async (req, res) => {
  try {
    const { semesterId, type, search, page, pageSize } = req.query;

    const whereClause = {};
    if (semesterId) whereClause.semesterId = parseInt(semesterId);
    if (type && type !== 'All') whereClause.type = type;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Opt-in pagination: only when ?page/?pageSize is supplied.
    const usePagination = page !== undefined || pageSize !== undefined;
    const findArgs = {
      where: whereClause,
      include: { attendance: true },
      orderBy: { sessionDate: 'desc' },
    };
    let pagination;
    if (usePagination) {
      const pageNum = parseId(page) || 1;
      const size = Math.min(parseId(pageSize) || 25, 200);
      findArgs.skip = (pageNum - 1) * size;
      findArgs.take = size;
      const total = await prisma.session.count({ where: whereClause });
      pagination = { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) };
    }

    const sessions = await prisma.session.findMany(findArgs);

    const formatted = sessions.map((session) => {
      const counts = { Present: 0, Late: 0, Absent: 0, Excused: 0 };
      session.attendance.forEach((rec) => {
        if (rec.status === 'PRESENT') counts.Present++;
        else if (rec.status === 'LATE') counts.Late++;
        else if (rec.status === 'ABSENT') counts.Absent++;
        else if (rec.status === 'EXCUSED') counts.Excused++;
      });
      const { attendance, ...sessionData } = session;
      return formatSession(sessionData, counts);
    });

    res.status(200).json({
      status: 'success',
      data: pagination ? { sessions: formatted, pagination } : { sessions: formatted },
    });
  } catch (err) {
    console.error('Get Sessions Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const getSession = async (req, res) => {
  try {
    const sessionId = parseId(req.params.id);
    if (!sessionId) return res.status(400).json({ status: 'fail', message: 'Invalid session id.' });
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { attendance: { include: { member: true } } },
    });
    if (!session) {
      return res.status(404).json({ status: 'fail', message: 'Session not found' });
    }
    res.status(200).json({ status: 'success', data: { session: formatSession(session) } });
  } catch (err) {
    console.error('Get Session Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createSession = async (req, res) => {
  try {
    const { semesterId, title, date, type, location, notes, description } = req.body;

    if (!semesterId || !date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide semesterId and date.',
      });
    }

    const sessionType = type || 'Practice';
    const sessionDate = new Date(date);
    const sessionTitle = title?.trim() || '';

    const newSession = await prisma.session.create({
      data: {
        semesterId: parseInt(semesterId),
        title: sessionTitle,
        sessionDate,
        type: sessionType,
        location: location || 'TMC Music Room',
        description: description || notes || '',
      },
    });

    // Create default PRESENT records for all active members
    const activeMembers = await prisma.member.findMany({ where: { status: 'ACTIVE' } });
    if (activeMembers.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: activeMembers.map((member) => ({
          sessionId: newSession.id,
          memberId: member.id,
          status: 'PRESENT',
        })),
        skipDuplicates: true,
      });
    }

    const formatted = formatSession(newSession);
    res.status(201).json({
      status: 'success',
      data: { session: formatted },
    });
  } catch (err) {
    console.error('Create Session Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type, location, notes, description } = req.body;

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (date !== undefined) data.sessionDate = new Date(date);
    if (type !== undefined) data.type = type;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    else if (notes !== undefined) data.description = notes;

    const updated = await prisma.session.update({
      where: { id: parseInt(id) },
      data,
    });

    const formatted = formatSession(updated);
    res.status(200).json({
      status: 'success',
      data: { session: formatted },
    });
  } catch (err) {
    console.error('Update Session Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendanceRecord.deleteMany({ where: { sessionId: parseInt(id) } });
    await prisma.session.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ status: 'success', message: 'Session deleted', data: null });
  } catch (err) {
    console.error('Delete Session Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
