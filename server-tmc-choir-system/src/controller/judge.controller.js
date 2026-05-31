import { prisma } from '../lib/prisma.js';
import { emit } from '../socket/index.js';

export const getJudges = async (req, res) => {
  try {
    const judges = await prisma.judge.findMany({
      include: {
        _count: { select: { evaluations: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const formattedJudges = judges.map((j) => ({
      id: j.id,
      name: j.fullName,
      title: j.titleRole || '',
      specialization: j.specialization || '',
      contact: j.contactNo || '',
      email: j.email || '',
      facebookAccount: j.facebookAccount || '',
      notes: j.notes || '',
      ratingsGiven: j._count.evaluations,
      createdAt: j.createdAt,
    }));

    res.status(200).json({
      status: 'success',
      data: { judges: formattedJudges },
    });
  } catch (err) {
    console.error('Get Judges Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createJudge = async (req, res) => {
  try {
    const { name, fullName, title, titleRole, specialization, contact, contactNo, email, facebookAccount, notes } = req.body;

    const dbFullName = fullName || name;
    if (!dbFullName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide full name.',
      });
    }

    const newJudge = await prisma.judge.create({
      data: {
        fullName: dbFullName,
        titleRole: titleRole || title || '',
        specialization: specialization || '',
        contactNo: contactNo || contact || '',
        email: email || '',
        facebookAccount: facebookAccount || '',
        notes: notes || '',
      },
    });

    emit('judge:created', newJudge);
    res.status(201).json({
      status: 'success',
      data: { judge: newJudge },
    });
  } catch (err) {
    console.error('Create Judge Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateJudge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, title, titleRole, specialization, contact, contactNo, email, facebookAccount, notes } = req.body;

    const data = {};
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

    emit('judge:updated', updatedJudge);
    res.status(200).json({
      status: 'success',
      data: { judge: updatedJudge },
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
    if (evalIds.length > 0) {
      await prisma.evaluationScore.deleteMany({ where: { evaluationId: { in: evalIds } } });
      await prisma.judgeEvaluation.deleteMany({ where: { judgeId } });
    }

    await prisma.judge.delete({ where: { id: judgeId } });

    emit('judge:deleted', { id: judgeId });
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
