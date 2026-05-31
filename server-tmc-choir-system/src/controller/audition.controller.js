import { prisma } from '../lib/prisma.js';
import { emit } from '../socket/index.js';

// Mapping between database category names and frontend camelCase keys
const categoryNameToKey = (name) => {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'vocalquality') return 'vocalQuality';
  if (normalized === 'pitchaccuracy') return 'pitchAccuracy';
  if (normalized === 'tone' || normalized === 'tonequality') return 'tone';
  if (normalized === 'rhythm') return 'rhythm';
  if (normalized === 'confidence') return 'confidence';
  if (normalized === 'stagepresence') return 'stagePresence';
  return name; // fallback
};

const keyToCategoryName = (key) => {
  if (key === 'vocalQuality') return 'Vocal Quality';
  if (key === 'pitchAccuracy') return 'Pitch Accuracy';
  if (key === 'tone') return 'Tone Quality';
  if (key === 'rhythm') return 'Rhythm';
  if (key === 'confidence') return 'Confidence';
  if (key === 'stagePresence') return 'Stage Presence';
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const CATEGORY_KEYS = ['vocalQuality', 'pitchAccuracy', 'tone', 'rhythm', 'confidence', 'stagePresence'];

// Helper to recalculate auditionee average rating
const recalculateAverageRating = async (auditioneeId) => {
  const evaluations = await prisma.judgeEvaluation.findMany({
    where: { auditioneeId },
    include: {
      scores: true,
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
    const evalSum = evalItem.scores.reduce((s, score) => s + score.score, 0);
    const evalAvg = evalSum / evalItem.scores.length;
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
    const { semesterId, status, targetPart, search } = req.query;

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
        { fullName: { contains: search } },
        { email: { contains: search } },
        { course: { contains: search } },
      ];
    }

    const auditionees = await prisma.auditionee.findMany({
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
    });

    const formattedAuditionees = auditionees.map((a) => {
      const ratings = a.evaluations.map((evalItem) => {
        const ratingObj = {
          judgeId: evalItem.judgeId,
          judgeName: evalItem.judge.fullName,
          comments: evalItem.comments || '',
        };

        // Initialize all keys to 0
        CATEGORY_KEYS.forEach(k => { ratingObj[k] = 0; });

        evalItem.scores.forEach((scoreItem) => {
          const key = categoryNameToKey(scoreItem.category.name);
          ratingObj[key] = scoreItem.score;
        });

        return ratingObj;
      });

      return {
        id: a.id,
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
      data: {
        auditionees: formattedAuditionees,
      },
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

    emit('auditionee:created', newAuditionee);
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

    emit('auditionee:updated', updatedAuditionee);
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
    const { id } = req.params;
    const auditioneeId = parseInt(id);

    // Delete scores and evaluations first due to foreign keys
    const evaluations = await prisma.judgeEvaluation.findMany({
      where: { auditioneeId },
    });

    const evalIds = evaluations.map(e => e.id);
    if (evalIds.length > 0) {
      await prisma.evaluationScore.deleteMany({
        where: { evaluationId: { in: evalIds } },
      });
      await prisma.judgeEvaluation.deleteMany({
        where: { auditioneeId },
      });
    }

    await prisma.auditionee.delete({ where: { id: auditioneeId } });

    emit('auditionee:deleted', { id: auditioneeId });
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

    emit('auditionee:statusChanged', updated);
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
    const { auditioneeId, judgeId, comments, overallNotes } = req.body;

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
    const scorePromises = CATEGORY_KEYS.map(async (key) => {
      const val = req.body[key];
      if (val === undefined) return;

      const categoryName = keyToCategoryName(key);

      // Find or create category
      const category = await prisma.evaluationCategory.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          percentage: 15.0, // default weight
        },
      });

      return prisma.evaluationScore.upsert({
        where: {
          evaluationId_categoryId: {
            evaluationId: evaluation.id,
            categoryId: category.id,
          },
        },
        update: {
          score: parseFloat(val),
        },
        create: {
          evaluationId: evaluation.id,
          categoryId: category.id,
          score: parseFloat(val),
        },
      });
    });

    await Promise.all(scorePromises);

    // Recalculate average rating for auditionee
    const avg = await recalculateAverageRating(parseInt(auditioneeId));

    emit('auditionee:evaluated', { auditioneeId: parseInt(auditioneeId), averageRating: avg });
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
