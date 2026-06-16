import { prisma } from '../lib/prisma.js';

// Common multi-word surname prefixes matching member.controller.js (L-8).
const SURNAME_PREFIXES = new Set(['de', 'dela', 'del', 'della', 'di', 'van', 'von', 'der', 'den', 'da', 'dos', 'las', 'los', 'san', 'santa', 'st', 'mac', 'mc', 'la', 'le']);

// Compute whether a semester is active based on its dates (mirrors the logic
// used by the frontend useSemesters hook — a semester is active if it has a
// start date and either no end date or the end date is in the future).
const computeIsActive = (sem) => {
  if (!sem.startDate) return false;
  const now = new Date();
  const notEnded = !sem.endDate || new Date(sem.endDate) > now;
  return notEnded;
};

// Normalize DB member record → frontend-friendly shape (mirrors
// member.controller.js formatMember).
const formatMember = (m) => {
  const nameParts = (m.fullName || '').trim().split(/\s+/).filter(Boolean);
  let firstName = m.fullName || '';
  let lastName = '';
  if (nameParts.length > 1) {
    let splitIndex = nameParts.length - 1;
    while (splitIndex > 1 && SURNAME_PREFIXES.has(nameParts[splitIndex - 1].toLowerCase())) {
      splitIndex--;
    }
    firstName = nameParts.slice(0, splitIndex).join(' ');
    lastName = nameParts.slice(splitIndex).join(' ');
  }
  const voicePart = m.voiceType
    ? m.voiceType.charAt(0).toUpperCase() + m.voiceType.slice(1).toLowerCase()
    : '';
  return {
    ...m,
    firstName,
    lastName,
    name: m.fullName,
    voicePart,
    email: m.emailOrFacebook || '',
    contactNumber: m.contactNo || '',
    status: (m.status || 'ACTIVE').toLowerCase(),
  };
};

/**
 * GET /api/reports/semesters
 * Returns all semesters with per-member attendance stats for admin Reports page.
 * Admins can see every member's attendance breakdown (present, absent, late,
 * excused, attendance rate) for each semester, including session-level detail.
 *
 * Optional query param: ?semesterId=N — returns only that semester's data.
 */
export const getSemesterAttendanceSummary = async (req, res) => {
  try {
    const { semesterId } = req.query;

    const where = semesterId ? { id: parseInt(semesterId) } : {};

    const semesters = await prisma.semester.findMany({
      where,
      include: {
        sessions: {
          include: {
            attendance: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const rawMembers = await prisma.member.findMany({
      orderBy: { fullName: 'asc' }
    });

    // Apply the same formatMember transformation used by member.controller.js
    // so frontend receives firstName, lastName, voicePart (not fullName, voiceType).
    const members = rawMembers.map(formatMember);

    const summary = semesters.map((sem) => {
      const memberStats = members.map((member) => {
        const memberSessions = sem.sessions
          .map((s) => {
            const record = s.attendance.find((r) => r.memberId === member.id);
            return record
              ? {
                  id: s.id,
                  title: s.title,
                  date: s.sessionDate,
                  type: s.type,
                  status: record.status,
                  notes: record.notes,
                }
              : null;
          })
          .filter(Boolean);

        const records = memberSessions.filter(Boolean);
        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const excused = records.filter((r) => r.status === 'EXCUSED').length;
        const recorded = records.length;
        const attendanceRate =
          recorded > 0 ? Math.round((present / recorded) * 100) : 0;

        return {
          memberId: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          voicePart: member.voicePart,
          course: member.course,
          status: member.status,
          present,
          absent,
          late,
          excused,
          recorded,
          attendanceRate,
          sessions: memberSessions,
        };
      });

      const totalSessions = sem.sessions.length;
      const activeMembers = memberStats.filter(
        (m) => m.status === 'active'
      );

      return {
        id: sem.id,
        name: sem.name,
        startDate: sem.startDate,
        endDate: sem.endDate,
        isActive: computeIsActive(sem),
        totalSessions,
        totalMembers: activeMembers.length,
        totalRecorded: memberStats.reduce((sum, m) => sum + m.recorded, 0),
        members: memberStats,
      };
    });

    res.status(200).json({ status: 'success', data: { semesters: summary } });
  } catch (error) {
    console.error('Report Semester Summary Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
