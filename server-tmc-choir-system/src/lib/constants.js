// Centralized status constants (L-4) — avoids magic strings scattered across
// controllers. These mirror the values used by the database, the Prisma enums,
// and the frontend so that comparisons stay consistent.

// Attendance status enum values (stored uppercase to match the Prisma enum).
export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
  EXCUSED: 'EXCUSED',
});

// Excuse review workflow states (stored as title-case strings on the record).
export const EXCUSE_STATUS = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
});
