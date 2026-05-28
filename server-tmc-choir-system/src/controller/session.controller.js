import { prisma } from '../lib/prisma.js';

export const getSessions = async (req, res) => {
  try {
    const { semesterId, type, search } = req.query;

    const whereClause = {};
    if (semesterId) {
      whereClause.semesterId = parseInt(semesterId);
    }
    if (type && type !== 'All') {
      whereClause.type = type;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        attendance: true,
      },
      orderBy: { sessionDate: 'desc' },
    });

    const formattedSessions = sessions.map((session) => {
      const counts = {
        Present: 0,
        Late: 0,
        Absent: 0,
        Excused: 0,
      };

      session.attendance.forEach((rec) => {
        if (rec.status === 'PRESENT') counts.Present++;
        else if (rec.status === 'LATE') counts.Late++;
        else if (rec.status === 'ABSENT') counts.Absent++;
        else if (rec.status === 'EXCUSED') counts.Excused++;
      });

      const { attendance, ...sessionData } = session;
      return {
        ...sessionData,
        counts,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        sessions: formattedSessions,
      },
    });
  } catch (err) {
    console.error('Get Sessions Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        attendance: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        status: 'fail',
        message: 'Session not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        session,
      },
    });
  } catch (err) {
    console.error('Get Session Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const createSession = async (req, res) => {
  try {
    const { semesterId, title, date, type, location, notes, description } = req.body;

    if (!semesterId || !title || !date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide semesterId, title, and date.',
      });
    }

    const newSession = await prisma.session.create({
      data: {
        semesterId: parseInt(semesterId),
        title,
        sessionDate: new Date(date),
        type: type || 'Practice',
        location: location || 'TMC Music Room',
        description: description || notes || '',
      },
    });

    // Automatically create empty attendance records for all active members in the semester
    const activeMembers = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeMembers.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: activeMembers.map((member) => ({
          sessionId: newSession.id,
          memberId: member.id,
          status: 'PRESENT', // default to PRESENT
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        session: newSession,
      },
    });
  } catch (err) {
    console.error('Create Session Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type, location, notes, description } = req.body;

    const data = {};
    if (title) data.title = title;
    if (date) data.sessionDate = new Date(date);
    if (type) data.type = type;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    else if (notes !== undefined) data.description = notes;

    const updatedSession = await prisma.session.update({
      where: { id: parseInt(id) },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: {
        session: updatedSession,
      },
    });
  } catch (err) {
    console.error('Update Session Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    // First delete all attendance records associated with the session
    await prisma.attendanceRecord.deleteMany({
      where: { sessionId: parseInt(id) },
    });

    // Then delete the session
    await prisma.session.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      status: 'success',
      message: 'Session deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Session Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
