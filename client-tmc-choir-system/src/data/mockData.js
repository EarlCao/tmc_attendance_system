// ─── SEMESTERS ──────────────────────────────────────────────────────────────
export const semesters = [
  { id: 1, name: '1st Semester SY 2023-2024', startDate: '2023-08-07', endDate: '2023-12-15', status: 'archived', totalSessions: 24 },
  { id: 2, name: '2nd Semester SY 2023-2024', startDate: '2024-01-08', endDate: '2024-05-31', status: 'archived', totalSessions: 22 },
  { id: 3, name: '1st Semester SY 2024-2025', startDate: '2024-08-05', endDate: '2024-12-20', status: 'archived', totalSessions: 26 },
  { id: 4, name: '2nd Semester SY 2024-2025', startDate: '2025-01-06', endDate: '2025-05-30', status: 'archived', totalSessions: 5 },
  { id: 5, name: '1st Semester SY 2025-2026', startDate: '2025-08-04', endDate: '2025-12-19', status: 'active', totalSessions: 18 },
]

export const activeSemester = semesters.find((s) => s.status === 'active')

// ─── OFFICERS ───────────────────────────────────────────────────────────────
export const officerAssignments = [
  { memberId: 16, position: 'President' },
  { memberId: 6, position: 'Vice President' },
  { memberId: 8, position: 'Secretary' },
  { memberId: 10, position: 'Treasurer' },
  { memberId: 1, position: 'Auditor' },
]

// ─── MEMBERS ────────────────────────────────────────────────────────────────
export const members = [
  { id: 1,  name: 'Reign Van Kylle Israel',     voicePart: 'Soprano', course: 'BSED Music', yearLevel: '3rd Year', religionDenomination: 'Roman Catholic', notes: 'Reliable soprano section lead for warm-ups.', email: 'reign.israel@email.com',     phone: '09171234001', status: 'active',   attendanceRate: 94, present: 17, late: 1, absent: 0, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 2,  name: 'Michelle Nocalan',        voicePart: 'Soprano', course: 'BSBA', yearLevel: '2nd Year', religionDenomination: 'Roman Catholic', notes: 'Prefers weekend reminders for practices.', email: 'michelle.nocalan@email.com',         phone: '09171234002', status: 'active',   attendanceRate: 89, present: 15, late: 1, absent: 2, excused: 0, joinedDate: '2023-08-01', address: 'Carmen, Bohol' },
  { id: 3,  name: 'Villa Mae Cajes',      voicePart: 'Soprano', course: 'BSED English', yearLevel: '4th Year', religionDenomination: 'UCCP', notes: 'Can assist with program hosting.', email: 'villa.cajes@email.com',       phone: '09171234003', status: 'active',   attendanceRate: 100, present: 18, late: 0, absent: 0, excused: 0, joinedDate: '2024-01-08', address: 'Tagbilaran City' },
  { id: 4,  name: 'Geraldine Timario',  voicePart: 'Soprano', course: 'BSIT', yearLevel: '1st Year', religionDenomination: 'Born Again Christian', notes: 'Inactive this semester due to schedule conflict.', email: 'geraldine.timario@email.com',   phone: '09171234004', status: 'inactive', attendanceRate: 72, present: 13, late: 0, absent: 5, excused: 0, joinedDate: '2023-08-01', address: 'Ubay, Bohol' },
  { id: 5,  name: 'Catherine Terce',     voicePart: 'Alto',    course: 'BSED Science', yearLevel: '3rd Year', religionDenomination: 'Roman Catholic', notes: 'Strong alto blend, assign near new members.', email: 'catherine.terce@email.com',     phone: '09181234005', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 6,  name: 'Loi Benisse Trago',     voicePart: 'Alto',    course: 'BSCrim', yearLevel: '2nd Year', religionDenomination: 'Iglesia ni Cristo', notes: 'Vice president; helps coordinate attendance.', email: 'loi.trago@email.com',     phone: '09181234006', status: 'active',   attendanceRate: 94, present: 17, late: 0, absent: 1, excused: 0, joinedDate: '2024-08-05', address: 'Talibon, Bohol' },
  { id: 7,  name: 'Lyca Lajato',    voicePart: 'Alto',    course: 'BSPsych', yearLevel: '4th Year', religionDenomination: 'Seventh-day Adventist', notes: 'May request schedule consideration on Saturdays.', email: 'lyca.lajato@email.com',     phone: '09181234007', status: 'active',   attendanceRate: 78, present: 13, late: 2, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Bien Unido, Bohol' },
  { id: 8,  name: 'Lhorrmae De Castro',   voicePart: 'Alto',    course: 'BSHM', yearLevel: '1st Year', religionDenomination: 'Roman Catholic', notes: 'Secretary; keeps rehearsal notes.', email: 'lhorrmae.decastro@email.com',   phone: '09181234008', status: 'active',   attendanceRate: 89, present: 16, late: 0, absent: 2, excused: 0, joinedDate: '2024-01-08', address: 'Jetafe, Bohol' },
  { id: 9,  name: 'Mica Omolon',      voicePart: 'Alto',   course: 'BSA', yearLevel: '3rd Year', religionDenomination: 'Roman Catholic', notes: 'Available for weekday practices.', email: 'mica.omolon@email.com',       phone: '09191234009', status: 'active',   attendanceRate: 94, present: 17, late: 0, absent: 1, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 10, name: 'Kenndey Saberon',    voicePart: 'Tenor',   course: 'BSIT', yearLevel: '2nd Year', religionDenomination: 'Baptist', notes: 'Treasurer; can assist with equipment setup.', email: 'kenndey.saberon@email.com',     phone: '09191234010', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2024-08-05', address: 'Sierra Bullones, Bohol' },
  { id: 11, name: 'John Lee Ranque',       voicePart: 'Tenor',   course: 'BSED Filipino', yearLevel: '4th Year', religionDenomination: 'Roman Catholic', notes: 'Needs early notice for performance call time.', email: 'john.ranque@email.com',       phone: '09191234011', status: 'active',   attendanceRate: 72, present: 12, late: 1, absent: 5, excused: 0, joinedDate: '2023-08-01', address: 'Candijay, Bohol' },
  { id: 12, name: 'Evander Legaspi',      voicePart: 'Tenor',   course: 'BSA', yearLevel: '1st Year', religionDenomination: 'UCCP', notes: 'Inactive; follow up before next auditions.', email: 'evander.legaspi@email.com',       phone: '09191234012', status: 'inactive', attendanceRate: 61, present: 11, late: 0, absent: 7, excused: 0, joinedDate: '2023-08-01', address: 'Mabini, Bohol' },
  { id: 13, name: 'Ian Borja',     voicePart: 'Tenor',    course: 'BSCS', yearLevel: '3rd Year', religionDenomination: 'Born Again Christian', notes: 'Consistent tenor support.', email: 'ian.borja@email.com',     phone: '09201234013', status: 'active',   attendanceRate: 100, present: 18, late: 0, absent: 0, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 14, name: 'Kim Gerald',       voicePart: 'Tenor',    course: 'BSHM', yearLevel: '2nd Year', religionDenomination: 'Roman Catholic', notes: 'Good for leading tenor sectional drills.', email: 'kim.gerald@email.com',       phone: '09201234014', status: 'active',   attendanceRate: 89, present: 16, late: 0, absent: 2, excused: 0, joinedDate: '2024-01-08', address: 'Dagohoy, Bohol' },
  { id: 15, name: 'Marquee Gabisan',       voicePart: 'Bass',    course: 'BSBA', yearLevel: '4th Year', religionDenomination: 'Roman Catholic', notes: 'Bass anchor for performance pieces.', email: 'marquee.gabisan@email.com',       phone: '09201234015', status: 'active',   attendanceRate: 78, present: 14, late: 0, absent: 4, excused: 0, joinedDate: '2024-08-05', address: 'Danao, Bohol' },
  { id: 16, name: 'Earl Francis Cao',        voicePart: 'Bass',    course: 'BSED Mathematics', yearLevel: '3rd Year', religionDenomination: 'Roman Catholic', notes: 'President; primary contact for semester planning.', email: 'earl.cao@email.com',         phone: '09201234016', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 17, name: 'Kristopher Jay Garcia',        voicePart: 'Bass',    course: 'BSIT', yearLevel: '2nd Year', religionDenomination: 'Baptist', notes: 'Can help with sound system setup.', email: 'kristopher.garcia@email.com',         phone: '09201234018', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 18, name: 'John Rey Hoylar',        voicePart: 'Bass',    course: 'BSCrim', yearLevel: '1st Year', religionDenomination: 'Roman Catholic', notes: 'Newer bass member; pair with senior bass.', email: 'john.hoylar@email.com',         phone: '09201234019', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },
  { id: 19, name: 'Julius Bardos',        voicePart: 'Bass',    course: 'BSED Social Studies', yearLevel: '4th Year', religionDenomination: 'Iglesia ni Cristo', notes: 'Available for community performances.', email: 'julius.bardos@email.com',         phone: '09201234021', status: 'active',   attendanceRate: 83, present: 14, late: 1, absent: 3, excused: 0, joinedDate: '2023-08-01', address: 'Trinidad, Bohol' },

]

// ─── ATTENDANCE SESSIONS ────────────────────────────────────────────────────
export const attendanceSessions = [
  { id: 401, date: '2025-01-13', semesterId: 4, type: 'Practice', notes: 'Opening rehearsal for 2nd semester' },
  { id: 402, date: '2025-02-03', semesterId: 4, type: 'Practice', notes: 'Sectional rehearsal for hymn arrangement' },
  { id: 403, date: '2025-03-10', semesterId: 4, type: 'Meeting', notes: 'Choir planning and attendance policy review' },
  { id: 404, date: '2025-04-07', semesterId: 4, type: 'Performance', notes: 'Lenten program performance' },
  { id: 405, date: '2025-05-19', semesterId: 4, type: 'Practice', notes: 'Final rehearsal and semester wrap-up' },
  { id: 1, date: '2025-08-04', semesterId: 5, type: 'Practice', notes: 'Opening rehearsal for 1st sem' },
  { id: 2, date: '2025-08-11', semesterId: 5, type: 'Practice', notes: '' },
  { id: 3, date: '2025-08-18', semesterId: 5, type: 'Practice', notes: '' },
  { id: 4, date: '2025-08-25', semesterId: 5, type: 'Performance', notes: 'Foundation Day performance' },
  { id: 5, date: '2025-09-01', semesterId: 5, type: 'Practice', notes: '' },
  { id: 6, date: '2025-09-08', semesterId: 5, type: 'Practice', notes: '' },
  { id: 7, date: '2025-09-15', semesterId: 5, type: 'Practice', notes: '' },
  { id: 8, date: '2025-09-22', semesterId: 5, type: 'Practice', notes: '' },
]

// ─── ATTENDANCE RECORDS ──────────────────────────────────────────────────────
const statusPool = ['Present','Present','Present','Present','Late','Absent','Excused']
function rndStatus() { return statusPool[Math.floor(Math.random() * statusPool.length)] }

function statusNote(status) {
  if (status === 'Late') return 'Arrived after warm-up.'
  if (status === 'Absent') return 'No attendance mark for this session.'
  if (status === 'Excused') return 'Excuse noted for review or approval.'
  return ''
}

export const attendanceRecords = attendanceSessions.flatMap((session) =>
  members.map((member) => {
    const status = rndStatus()

    return {
      id: `${session.id}-${member.id}`,
      sessionId: session.id,
      memberId: member.id,
      memberName: member.name,
      voicePart: member.voicePart,
      status,
      notes: statusNote(status),
      excuseReason: status === 'Excused' ? 'Academic or family reason submitted.' : '',
      date: session.date,
    }
  })
)

// ─── ABSENCES & EXCUSES ─────────────────────────────────────────────────────
export const excuses = [
  { id: 101, memberId: 5,  memberName: 'Catherine Terce',          voicePart: 'Alto',    date: '2025-02-03', reason: 'Academic requirement — scheduled class presentation.', status: 'Approved', submittedAt: '2025-02-02', reviewedAt: '2025-02-03', notes: 'Approved by choir adviser.' },
  { id: 102, memberId: 11, memberName: 'John Lee Ranque',          voicePart: 'Tenor',   date: '2025-03-10', reason: 'Medical appointment — follow-up check-up.', status: 'Approved', submittedAt: '2025-03-09', reviewedAt: '2025-03-10', notes: 'With appointment slip.' },
  { id: 103, memberId: 17, memberName: 'Kristopher Jay Garcia',    voicePart: 'Bass',    date: '2025-04-07', reason: 'Family obligation — out of town travel.', status: 'Rejected', submittedAt: '2025-04-06', reviewedAt: '2025-04-07', notes: 'Performance attendance was required.' },
  { id: 1, memberId: 4,  memberName: 'Grace Dela Cruz',  voicePart: 'Soprano', date: '2025-08-25', reason: 'Family emergency — hospitalization of parent.', status: 'Approved', submittedAt: '2025-08-24', reviewedAt: '2025-08-25', notes: 'With supporting document.' },
  { id: 2, memberId: 7,  memberName: 'Joy Fernandez',    voicePart: 'Alto',    date: '2025-09-08', reason: 'Academic exam — midterm examination schedule.', status: 'Approved', submittedAt: '2025-09-07', reviewedAt: '2025-09-08', notes: '' },
  { id: 3, memberId: 11, memberName: 'Paolo Cruz',       voicePart: 'Tenor',   date: '2025-09-15', reason: 'Medical appointment — scheduled check-up.', status: 'Pending',  submittedAt: '2025-09-14', reviewedAt: null, notes: '' },
  { id: 4, memberId: 2,  memberName: 'Ana Reyes',        voicePart: 'Soprano', date: '2025-09-22', reason: 'Community work — barangay activity requirement.', status: 'Pending',  submittedAt: '2025-09-21', reviewedAt: null, notes: '' },
  { id: 5, memberId: 15, memberName: 'Jun Ocampo',       voicePart: 'Bass',    date: '2025-08-11', reason: 'Work conflict — part-time job schedule.', status: 'Rejected', submittedAt: '2025-08-10', reviewedAt: '2025-08-11', notes: 'Unexcused. Choir schedule was communicated in advance.' },
  { id: 6, memberId: 10, memberName: 'Marco De Leon',    voicePart: 'Tenor',   date: '2025-09-01', reason: 'Sick — fever and flu symptoms.', status: 'Approved', submittedAt: '2025-08-31', reviewedAt: '2025-09-01', notes: 'Medical certificate attached.' },
  { id: 7, memberId: 16, memberName: 'Noel Basa',        voicePart: 'Bass',    date: '2025-09-22', reason: 'Transportation issue — no available ride.', status: 'Pending', submittedAt: '2025-09-22', reviewedAt: null, notes: '' },
]

// ─── JUDGES ─────────────────────────────────────────────────────────────────
export const judges = [
  { id: 1, name: 'Dr. Melanie Uy',        title: 'Professor of Music', specialization: 'Vocal Performance', contact: '09171110001', email: 'melanie.uy@tmc.edu.ph', status: 'active', ratingsGiven: 12 },
  { id: 2, name: 'Mr. Roberto Tan',       title: 'Music Director',     specialization: 'Choral Conducting', contact: '09171110002', email: 'roberto.tan@tmc.edu.ph',  status: 'active', ratingsGiven: 10 },
  { id: 3, name: 'Ms. Cecilia Flores',    title: 'Voice Coach',        specialization: 'Soprano & Alto Coaching', contact: '09171110003', email: 'cecilia.flores@tmc.edu.ph', status: 'active', ratingsGiven: 9 },
]

// ─── AUDITIONS ───────────────────────────────────────────────────────────────
export const auditionees = [
  {
    id: 1, name: 'Bianca Lim',     targetPart: 'Soprano', age: 19, course: 'BEED', yearLevel: '2nd Year', religionDenomination: 'Roman Catholic', contact: '09271110001', email: 'bianca@example.com', address: 'Trinidad, Bohol', notes: 'Clear soprano tone and confident stage presence.', status: 'Passed', auditionDate: '2025-08-02',
    ratings: [
      { judgeId: 1, judgeName: 'Dr. Melanie Uy',    vocalQuality: 9, pitchAccuracy: 8, tone: 9, rhythm: 8, confidence: 9, stagePresence: 8, comments: 'Excellent range, clean head voice.' },
      { judgeId: 2, judgeName: 'Mr. Roberto Tan',   vocalQuality: 8, pitchAccuracy: 9, tone: 8, rhythm: 9, confidence: 8, stagePresence: 9, comments: 'Good musicality and rhythm sense.' },
      { judgeId: 3, judgeName: 'Ms. Cecilia Flores',vocalQuality: 9, pitchAccuracy: 8, tone: 9, rhythm: 8, confidence: 8, stagePresence: 9, comments: 'Breath support is impressive.' },
    ],
  },
  {
    id: 2, name: 'Kevin Dela Pena', targetPart: 'Bass',    age: 21, course: 'BSCRIM', yearLevel: '3rd Year', religionDenomination: 'Baptist', contact: '09271110002', email: 'kevin@example.com', address: 'Talibon, Bohol', notes: 'Promising bass range; needs projection practice.', status: 'Passed', auditionDate: '2025-08-02',
    ratings: [
      { judgeId: 1, judgeName: 'Dr. Melanie Uy',    vocalQuality: 8, pitchAccuracy: 7, tone: 8, rhythm: 8, confidence: 7, stagePresence: 7, comments: 'Good low range. Needs projection work.' },
      { judgeId: 2, judgeName: 'Mr. Roberto Tan',   vocalQuality: 7, pitchAccuracy: 8, tone: 8, rhythm: 7, confidence: 8, stagePresence: 7, comments: 'Solid bass tone.' },
      { judgeId: 3, judgeName: 'Ms. Cecilia Flores',vocalQuality: 8, pitchAccuracy: 7, tone: 9, rhythm: 8, confidence: 7, stagePresence: 8, comments: 'Warm dark tone, very promising.' },
    ],
  },
  {
    id: 3, name: 'Diane Castro',    targetPart: 'Alto',    age: 20, course: 'BSED', yearLevel: '2nd Year', religionDenomination: 'UCCP', contact: '09271110003', email: 'diane@example.com', address: 'Carmen, Bohol', notes: 'Stable pitch and good ensemble awareness.', status: 'Passed', auditionDate: '2025-08-02',
    ratings: [
      { judgeId: 1, judgeName: 'Dr. Melanie Uy',    vocalQuality: 7, pitchAccuracy: 8, tone: 7, rhythm: 8, confidence: 8, stagePresence: 7, comments: 'Stable pitch. Continue developing lower register.' },
      { judgeId: 2, judgeName: 'Mr. Roberto Tan',   vocalQuality: 8, pitchAccuracy: 7, tone: 8, rhythm: 7, confidence: 7, stagePresence: 8, comments: 'Good ensemble potential.' },
      { judgeId: 3, judgeName: 'Ms. Cecilia Flores',vocalQuality: 7, pitchAccuracy: 8, tone: 7, rhythm: 8, confidence: 8, stagePresence: 7, comments: 'Consistent alto tone.' },
    ],
  },
  {
    id: 4, name: 'Ryan Bautista',   targetPart: 'Tenor',   age: 22, course: 'BSIT', yearLevel: '4th Year', religionDenomination: 'Born Again Christian', contact: '09271110004', email: 'ryan@example.com', address: 'Ubay, Bohol', notes: 'Recommended to take vocal coaching before re-audition.', status: 'Failed', auditionDate: '2025-08-02',
    ratings: [
      { judgeId: 1, judgeName: 'Dr. Melanie Uy',    vocalQuality: 5, pitchAccuracy: 5, tone: 5, rhythm: 6, confidence: 5, stagePresence: 5, comments: 'Significant pitch issues throughout.' },
      { judgeId: 2, judgeName: 'Mr. Roberto Tan',   vocalQuality: 5, pitchAccuracy: 5, tone: 5, rhythm: 5, confidence: 6, stagePresence: 5, comments: 'Needs more voice training before re-auditioning.' },
      { judgeId: 3, judgeName: 'Ms. Cecilia Flores',vocalQuality: 5, pitchAccuracy: 5, tone: 6, rhythm: 5, confidence: 5, stagePresence: 5, comments: 'Recommend vocal lessons and re-audition next semester.' },
    ],
  },
  {
    id: 5, name: 'Patricia Flores', targetPart: 'Soprano', age: 18, course: 'BSOA', yearLevel: '1st Year', religionDenomination: 'Roman Catholic', contact: '09271110005', email: 'patricia@example.com', address: 'Tagbilaran City', notes: 'Pending evaluation from assigned judges.', status: 'Pending', auditionDate: '2025-09-06',
    ratings: [],
  },
  {
    id: 6, name: 'Renz Morales',    targetPart: 'Bass',    age: 20, course: 'BSCOM', yearLevel: '2nd Year', religionDenomination: 'Iglesia ni Cristo', contact: '09271110006', email: 'renz@example.com', address: 'Danao, Bohol', notes: 'Available for evening rehearsals.', status: 'Pending', auditionDate: '2025-09-06',
    ratings: [],
  },
  {
    id: 7, name: 'Sheila Abad',     targetPart: 'Alto',    age: 21, course: 'BSPOL', yearLevel: '3rd Year', religionDenomination: 'Seventh-day Adventist', contact: '09271110007', email: 'sheila@example.com', address: 'Jetafe, Bohol', notes: 'Strong musical ear and reliable alto placement.', status: 'Passed', auditionDate: '2025-08-02',
    ratings: [
      { judgeId: 1, judgeName: 'Dr. Melanie Uy',    vocalQuality: 8, pitchAccuracy: 9, tone: 8, rhythm: 9, confidence: 8, stagePresence: 8, comments: 'Very accurate pitch, great ear.' },
      { judgeId: 2, judgeName: 'Mr. Roberto Tan',   vocalQuality: 8, pitchAccuracy: 8, tone: 9, rhythm: 8, confidence: 9, stagePresence: 8, comments: 'Strong performance presence.' },
      { judgeId: 3, judgeName: 'Ms. Cecilia Flores',vocalQuality: 9, pitchAccuracy: 8, tone: 8, rhythm: 8, confidence: 8, stagePresence: 9, comments: 'Outstanding tone quality.' },
    ],
  },
]

// ─── ACTIVITIES ──────────────────────────────────────────────────────────────
export const upcomingActivities = [
  { id: 1, title: 'Weekly Choir Practice', date: '2025-10-06', time: '4:00 PM – 6:00 PM', location: 'TMC Music Room', type: 'Practice' },
  { id: 2, title: 'University Foundation Day Performance', date: '2025-10-15', time: '9:00 AM', location: 'TMC Gymnasium', type: 'Performance' },
  { id: 3, title: 'Semester Auditions (Batch 2)', date: '2025-10-20', time: '1:00 PM – 5:00 PM', location: 'Music Hall', type: 'Audition' },
  { id: 4, title: 'Christmas Concert Rehearsal', date: '2025-11-03', time: '4:00 PM', location: 'TMC Music Room', type: 'Practice' },
  { id: 5, title: 'City Choir Festival', date: '2025-11-22', time: '8:00 AM', location: 'City Cultural Center', type: 'Performance' },
]

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export const getDashboardStats = () => {
  const activeMembers = members.filter((m) => m.status === 'active').length
  return {
    totalMembers: members.length,
    activeMembers,
    presentToday: 12,
    absentToday: 3,
    lateToday: 1,
    excusedToday: 0,
    pendingExcuses: excuses.filter((e) => e.status === 'Pending').length,
    activeSemesterName: activeSemester?.name ?? '—',
    averageAttendance: Math.round(members.reduce((a, m) => a + m.attendanceRate, 0) / members.length),
  }
}
