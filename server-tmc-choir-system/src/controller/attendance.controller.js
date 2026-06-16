import { prisma } from '../lib/prisma.js';
import { ATTENDANCE_STATUS, EXCUSE_STATUS } from '../lib/constants.js';

// Helper to map DB attendance status to frontend status
const mapStatusToFrontend = (status) => {
  if (status === ATTENDANCE_STATUS.PRESENT) return 'Present';
  if (status === ATTENDANCE_STATUS.LATE) return 'Late';
  if (status === ATTENDANCE_STATUS.ABSENT) return 'Absent';
  if (status === ATTENDANCE_STATUS.EXCUSED) return 'Excused';
  return status;
};

// Helper to map frontend status to DB enum
const mapStatusToDb = (status) => {
  if (!status) return ATTENDANCE_STATUS.PRESENT;
  const upper = status.toUpperCase();
  if (Object.values(ATTENDANCE_STATUS).includes(upper)) {
    return upper;
  }
  return ATTENDANCE_STATUS.PRESENT;
};

export const getAttendanceForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId: parseInt(sessionId) },
      include: { member: true },
    });

    const formattedRecords = records.map((rec) => ({
      id: rec.id,
      sessionId: rec.sessionId,
      memberId: rec.memberId,
      memberName: rec.member.fullName,
      voicePart: rec.member.voiceType.charAt(0) + rec.member.voiceType.slice(1).toLowerCase(),
      status: mapStatusToFrontend(rec.status),
      notes: rec.notes || '',
      excuseStatus: rec.excuseStatus || 'Pending',
      excuseReason: rec.excuseReason || '',
    }));

    res.status(200).json({
      status: 'success',
      data: { records: formattedRecords },
    });
  } catch (err) {
    console.error('Get Attendance for Session Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const saveAttendanceForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of attendance records.',
      });
    }

    const updates = records.map((rec) => {
      const dbStatus = mapStatusToDb(rec.status);
      const data = {
        status: dbStatus,
        notes: rec.notes || '',
      };

      if (dbStatus === ATTENDANCE_STATUS.EXCUSED) {
        data.excuseReason = rec.excuseReason || rec.notes || 'No reason provided';
        data.excuseStatus = rec.excuseStatus || EXCUSE_STATUS.PENDING;
      }

      return prisma.attendanceRecord.upsert({
        where: {
          sessionId_memberId: {
            sessionId: parseInt(sessionId),
            memberId: parseInt(rec.memberId),
          },
        },
        update: data,
        create: {
          sessionId: parseInt(sessionId),
          memberId: parseInt(rec.memberId),
          ...data,
        },
      });
    });

    await prisma.$transaction(updates);

    // Recalculate attendance rates for affected members
    const memberIds = records.map(r => parseInt(r.memberId));
    for (const memberId of memberIds) {
      const memberRecords = await prisma.attendanceRecord.findMany({ where: { memberId } });
      const total = memberRecords.length;
      if (total > 0) {
        const presentCount = memberRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
        const lateCount = memberRecords.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
        const excusedCount = memberRecords.filter(r => r.status === ATTENDANCE_STATUS.EXCUSED && r.excuseStatus === EXCUSE_STATUS.APPROVED).length;
        const attended = presentCount + (lateCount * 0.5) + excusedCount;
        const attendanceRate = Math.round((attended / total) * 100);
        // Store the computed rate in its own column — never overwrite the
        // admin-authored `notes` field.
        await prisma.member.update({
          where: { id: memberId },
          data: { attendanceRate },
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Attendance saved successfully',
    });
  } catch (err) {
    console.error('Save Attendance Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const getExcuses = async (req, res) => {
  try {
    const { status, voicePart } = req.query;

    const whereClause = { status: ATTENDANCE_STATUS.EXCUSED };

    if (status) {
      whereClause.excuseStatus = status;
    }

    if (voicePart && voicePart !== 'All') {
      whereClause.member = { voiceType: voicePart.toUpperCase() };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: { member: true, session: true },
      orderBy: { createdAt: 'desc' },
    });

    const excuses = records.map((rec) => ({
      id: rec.id,
      sessionId: rec.sessionId,
      semesterId: rec.session.semesterId,
      memberId: rec.memberId,
      memberName: rec.member.fullName,
      voicePart: rec.member.voiceType.charAt(0) + rec.member.voiceType.slice(1).toLowerCase(),
      date: rec.session.sessionDate.toISOString().slice(0, 10),
      reason: rec.excuseReason || rec.notes || 'No reason provided',
      status: rec.excuseStatus || EXCUSE_STATUS.PENDING,
      submittedAt: rec.createdAt.toISOString().slice(0, 10),
      // Use the real review timestamp; null until the excuse is actually reviewed.
      reviewedAt: rec.reviewedAt ? rec.reviewedAt.toISOString().slice(0, 10) : null,
      notes: rec.notes || '',
    }));

    res.status(200).json({
      status: 'success',
      data: { excuses },
    });
  } catch (err) {
    console.error('Get Excuses Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateExcuseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide excuse status (Approved or Rejected).',
      });
    }

    const record = await prisma.attendanceRecord.findUnique({ where: { id: parseInt(id) } });
    if (!record) {
      return res.status(404).json({ status: 'fail', message: 'Excuse record not found.' });
    }

    const updateData = { excuseStatus: status };
    if (notes) updateData.notes = notes;
    // Stamp the actual review time when the excuse transitions out of Pending.
    if (status && status !== EXCUSE_STATUS.PENDING) {
      updateData.reviewedAt = new Date();
    }

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({
      status: 'success',
      data: { record: updatedRecord },
    });
  } catch (err) {
    console.error('Update Excuse Status Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
