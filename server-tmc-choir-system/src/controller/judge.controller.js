import { prisma } from '../lib/prisma.js';

const formatJudge = (j) => ({
  id: j.id,
  semesterId: j.semesterId ?? null,
  name: j.fullName,
  title: j.titleRole || '',
  specialization: j.specialization || '',
  contact: j.contactNo || '',
  email: j.email || '',
  facebookAccount: j.facebookAccount || '',
  notes: j.notes || '',
  status: j.status || 'active',
  ratingsGiven: j._count?.evaluations ?? 0,
  createdAt: j.createdAt,
});

const getActiveSemesterId = async () => {
  const now = new Date();
  const activeSemester = await prisma.semester.findFirst({
    where: {
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: [
      { startDate: 'desc' },
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
  });

  return activeSemester?.id ?? null;
};

export const getJudges = async (req, res) => {
  try {
    const { semesterId } = req.query;
    const where = {};
    if (semesterId) where.semesterId = parseInt(semesterId);

    const judges = await prisma.judge.findMany({
      where,
      include: {
        _count: { select: { evaluations: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: { judges: judges.map(formatJudge) },
    });
  } catch (err) {
    console.error('Get Judges Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createJudge = async (req, res) => {
  try {
    const { semesterId, name, fullName, title, titleRole, specialization, contact, contactNo, email, facebookAccount, notes } = req.body;

    const dbFullName = fullName || name;
    if (!dbFullName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide full name.',
      });
    }

    const targetSemesterId = semesterId ? parseInt(semesterId) : await getActiveSemesterId();
    if (!targetSemesterId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please create or open an active semester before adding judges.',
      });
    }

    const newJudge = await prisma.judge.create({
      data: {
        semesterId: targetSemesterId,
        fullName: dbFullName,
        titleRole: titleRole || title || '',
        specialization: specialization || '',
        contactNo: contactNo || contact || '',
        email: email || '',
        facebookAccount: facebookAccount || '',
        notes: notes || '',
      },
    });

    res.status(201).json({
      status: 'success',
      data: { judge: formatJudge(newJudge) },
    });
  } catch (err) {
    console.error('Create Judge Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateJudge = async (req, res) => {
  try {
    const { id } = req.params;
    const { semesterId, name, fullName, title, titleRole, specialization, contact, contactNo, email, facebookAccount, notes } = req.body;

    const data = {};
    if (semesterId !== undefined) data.semesterId = semesterId ? parseInt(semesterId) : null;
    if (fullName !== undefined || name !== undefined) data.fullName = fullName || name;
    if (titleRole !== undefined || title !== undefined) data.titleRole = titleRole || title;
    if (specialization !== undefined) data.specialization = specialization;
    if (contactNo !== undefined || contact !== undefined) data.contactNo = contactNo || contact;
    if (email !== undefined) data.email = email;
    if (facebookAccount !== undefined) data.facebookAccount = facebookAccount;
    if (notes !== undefined) data.notes = notes;

    const updatedJudge = await prisma.judge.update({
      where: { id: parseInt(id) },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: { judge: formatJudge(updatedJudge) },
    });
  } catch (err) {
    console.error('Update Judge Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteJudge = async (req, res) => {
  try {
    const judgeId = parseInt(req.params.id);

    const evaluations = await prisma.judgeEvaluation.findMany({ where: { judgeId } });
    const evalIds = evaluations.map(e => e.id);

    // Delete dependent scores/evaluations then the judge atomically (no
    // schema-level cascade), so a partial failure can't orphan rows.
    await prisma.$transaction([
      ...(evalIds.length > 0
        ? [
            prisma.evaluationScore.deleteMany({ where: { evaluationId: { in: evalIds } } }),
            prisma.judgeEvaluation.deleteMany({ where: { judgeId } }),
          ]
        : []),
      prisma.judge.delete({ where: { id: judgeId } }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Judge deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Judge Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
