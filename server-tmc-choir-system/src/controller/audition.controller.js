import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/security.js';

const recalculateAverageRating = async (auditioneeId) => {
  const evaluations = await prisma.judgeEvaluation.findMany({
    where: { auditioneeId },
    include: {
      scores: {
        include: {
          category: true,
        },
      },
    },
  });

  if (evaluations.length === 0) {
    await prisma.auditionee.update({
      where: { id: auditioneeId },
      data: { averageRating: null },
    });
    return null;
  }

  let totalRatingSum = 0;
  evaluations.forEach((evalItem) => {
    if (evalItem.scores.length === 0) return;
    let evalSum = 0;
    let totalWeight = 0;
    evalItem.scores.forEach(scoreItem => {
      const weight = scoreItem.category.percentage || 0;
      evalSum += scoreItem.score * weight;
      totalWeight += weight;
    });
    // If weights aren't set or sum to 0, fallback to simple average
    const evalAvg = totalWeight > 0 ? (evalSum / totalWeight) : (evalItem.scores.reduce((s, score) => s + score.score, 0) / evalItem.scores.length);
    totalRatingSum += evalAvg;
  });

  const overallAverage = parseFloat((totalRatingSum / evaluations.length).toFixed(1));

  await prisma.auditionee.update({
    where: { id: auditioneeId },
    data: { averageRating: overallAverage },
  });

  return overallAverage;
};

export const getAuditionees = async (req, res) => {
  try {
    const { semesterId, status, targetPart, search, page, pageSize } = req.query;

    const whereClause = {};
    if (semesterId) {
      whereClause.semesterId = parseInt(semesterId);
    }
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    if (targetPart && targetPart !== 'All') {
      whereClause.targetVoiceType = targetPart.toUpperCase();
    }
    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { course: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Opt-in pagination: only when ?page/?pageSize is supplied.
    const usePagination = page !== undefined || pageSize !== undefined;
    const findArgs = {
      where: whereClause,
      include: {
        evaluations: {
          include: {
            judge: true,
            scores: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    };
    let pagination;
    if (usePagination) {
      const pageNum = parseId(page) || 1;
      const size = parseId(pageSize) || 25;
      findArgs.skip = (pageNum - 1) * size;
      findArgs.take = size;
      const total = await prisma.auditionee.count({ where: whereClause });
      pagination = { page: pageNum, pageSize: size, total, totalPages: Math.ceil(total / size) };
    }

    const auditionees = await prisma.auditionee.findMany(findArgs);

    const formattedAuditionees = auditionees.map((a) => {
      const ratings = a.evaluations.map((evalItem) => {
        return {
          judgeId: evalItem.judgeId,
          judgeName: evalItem.judge.fullName,
          comments: evalItem.comments || '',
          scores: evalItem.scores.map(s => ({
            categoryId: s.categoryId,
            categoryName: s.category.name,
            score: s.score,
            percentage: s.category.percentage
          }))
        };
      });

      return {
        id: a.id,
        semesterId: a.semesterId,
        name: a.fullName,
        targetPart: a.targetVoiceType ? a.targetVoiceType.charAt(0) + a.targetVoiceType.slice(1).toLowerCase() : 'Soprano',
        age: a.age || 0,
        course: a.course || '',
        yearLevel: a.yearLevel || '',
        religionDenomination: a.religion || '',
        contact: a.contactNo || '',
        email: a.email || '',
        address: a.address || '',
        notes: a.registryNotes || '',
        status: a.status,
        auditionDate: a.auditionDate.toISOString().slice(0, 10),
        averageRating: a.averageRating,
        ratings,
      };
    });

    res.status(200).json({
      status: 'success',
      data: pagination
        ? { auditionees: formattedAuditionees, pagination }
        : { auditionees: formattedAuditionees },
    });
  } catch (err) {
    console.error('Get Auditionees Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const createAuditionee = async (req, res) => {
  try {
    const {
      semesterId,
      name,
      fullName,
      targetPart,
      targetVoiceType,
      age,
      course,
      yearLevel,
      religionDenomination,
      religion,
      contact,
      contactNo,
      email,
      address,
      notes,
      registryNotes,
      auditionDate,
      status,
    } = req.body;

    const dbFullName = fullName || name;
    if (!semesterId || !dbFullName || !auditionDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide semesterId, fullName/name, and auditionDate.',
      });
    }

    const voice = targetVoiceType || targetPart || 'SOPRANO';
    const dbAuditionDate = new Date(auditionDate);

    const newAuditionee = await prisma.auditionee.create({
      data: {
        semesterId: parseInt(semesterId),
        fullName: dbFullName,
        age: age ? parseInt(age) : null,
        targetVoiceType: voice.toUpperCase(),
        course: course || '',
        yearLevel: yearLevel || '',
        contactNo: contactNo || contact || '',
        religion: religion || religionDenomination || '',
        email: email || '',
        address: address || '',
        registryNotes: registryNotes || notes || '',
        auditionDate: dbAuditionDate,
        status: status || 'Pending',
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        auditionee: newAuditionee,
      },
    });
  } catch (err) {
    console.error('Create Auditionee Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateAuditionee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      fullName,
      targetPart,
      targetVoiceType,
      age,
      course,
      yearLevel,
      religionDenomination,
      religion,
      contact,
      contactNo,
      email,
      address,
      notes,
      registryNotes,
      auditionDate,
      status,
    } = req.body;

    const data = {};
    if (fullName !== undefined || name !== undefined) data.fullName = fullName || name;
    if (targetVoiceType !== undefined || targetPart !== undefined) {
      const part = targetVoiceType || targetPart;
      data.targetVoiceType = part.toUpperCase();
    }
    if (age !== undefined) data.age = age ? parseInt(age) : null;
    if (course !== undefined) data.course = course;
    if (yearLevel !== undefined) data.yearLevel = yearLevel;
    if (contactNo !== undefined || contact !== undefined) data.contactNo = contactNo || contact;
    if (religion !== undefined || religionDenomination !== undefined) data.religion = religion || religionDenomination;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (registryNotes !== undefined || notes !== undefined) data.registryNotes = registryNotes || notes;
    if (auditionDate !== undefined) data.auditionDate = new Date(auditionDate);
    if (status !== undefined) data.status = status;

    const updatedAuditionee = await prisma.auditionee.update({
      where: { id: parseInt(id) },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: {
        auditionee: updatedAuditionee,
      },
    });
  } catch (err) {
    console.error('Update Auditionee Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const deleteAuditionee = async (req, res) => {
  try {
    const auditioneeId = parseId(req.params.id);
    if (!auditioneeId) return res.status(400).json({ status: 'fail', message: 'Invalid auditionee id.' });

    // Delete scores and evaluations first (no schema-level cascade), then the
    // auditionee — atomically so a partial failure never leaves orphaned rows.
    const evaluations = await prisma.judgeEvaluation.findMany({
      where: { auditioneeId },
    });
    const evalIds = evaluations.map(e => e.id);

    await prisma.$transaction([
      ...(evalIds.length > 0
        ? [
            prisma.evaluationScore.deleteMany({ where: { evaluationId: { in: evalIds } } }),
            prisma.judgeEvaluation.deleteMany({ where: { auditioneeId } }),
          ]
        : []),
      prisma.auditionee.delete({ where: { id: auditioneeId } }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Auditionee deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Auditionee Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateAuditioneeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Passed, Failed, Pending

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide status.',
      });
    }

    const updated = await prisma.auditionee.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.status(200).json({
      status: 'success',
      data: {
        auditionee: updated,
      },
    });
  } catch (err) {
    console.error('Update Auditionee Status Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const saveEvaluation = async (req, res) => {
  try {
    const { auditioneeId, judgeId, comments, overallNotes, scores } = req.body;

    if (!auditioneeId || !judgeId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide auditioneeId and judgeId.',
      });
    }

    // Upsert the evaluation
    const evaluation = await prisma.judgeEvaluation.upsert({
      where: {
        auditioneeId_judgeId: {
          auditioneeId: parseInt(auditioneeId),
          judgeId: parseInt(judgeId),
        },
      },
      update: {
        comments: comments || '',
        overallNotes: overallNotes || '',
      },
      create: {
        auditioneeId: parseInt(auditioneeId),
        judgeId: parseInt(judgeId),
        comments: comments || '',
        overallNotes: overallNotes || '',
      },
    });

    // Now upsert scores for each category
    const scorePromises = (scores || []).map(async (item) => {
      if (!item.categoryId || item.score === undefined) return;

      return prisma.evaluationScore.upsert({
        where: {
          evaluationId_categoryId: {
            evaluationId: evaluation.id,
            categoryId: parseInt(item.categoryId),
          },
        },
        update: {
          score: parseFloat(item.score),
        },
        create: {
          evaluationId: evaluation.id,
          categoryId: parseInt(item.categoryId),
          score: parseFloat(item.score),
        },
      });
    });

    await Promise.all(scorePromises);

    // Recalculate average rating for auditionee
    const avg = await recalculateAverageRating(parseInt(auditioneeId));

    res.status(200).json({
      status: 'success',
      message: 'Evaluation saved successfully',
      data: { averageRating: avg },
    });
  } catch (err) {
    console.error('Save Evaluation Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
