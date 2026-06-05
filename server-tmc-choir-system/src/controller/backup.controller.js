import { prisma } from '../lib/prisma.js';

export const exportBackup = async (req, res) => {
  try {
    const [
      semesters,
      members,
      sessions,
      attendanceRecords,
      officers,
      judges,
      auditionees,
      judgeEvaluations,
      evaluationScores,
      evaluationCategories,
      rules,
    ] = await Promise.all([
      prisma.semester.findMany({ orderBy: { id: 'asc' } }),
      prisma.member.findMany({ orderBy: { id: 'asc' } }),
      prisma.session.findMany({ orderBy: { id: 'asc' } }),
      prisma.attendanceRecord.findMany({ orderBy: { id: 'asc' } }),
      prisma.officer.findMany({ orderBy: { id: 'asc' } }),
      prisma.judge.findMany({ orderBy: { id: 'asc' } }),
      prisma.auditionee.findMany({ orderBy: { id: 'asc' } }),
      prisma.judgeEvaluation.findMany({ orderBy: { id: 'asc' } }),
      prisma.evaluationScore.findMany({ orderBy: { id: 'asc' } }),
      prisma.evaluationCategory.findMany({ orderBy: { id: 'asc' } }),
      prisma.ruleRegulation.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      system: 'TMC Choir Attendance System',
      data: {
        semesters,
        members,
        sessions,
        attendanceRecords,
        officers,
        judges,
        auditionees,
        judgeEvaluations,
        evaluationScores,
        evaluationCategories,
        rules,
      },
    };

    const filename = `tmc-choir-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(backup);
  } catch (err) {
    console.error('Export Backup Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to export backup.' });
  }
};
