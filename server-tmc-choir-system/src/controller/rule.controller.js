import { prisma } from '../lib/prisma.js';

export const getRules = async (req, res) => {
  try {
    const { semesterId } = req.query;

    const whereClause = {};
    if (semesterId) {
      whereClause.semesterId = parseInt(semesterId);
    }

    const rules = await prisma.ruleRegulation.findMany({
      where: whereClause,
      include: {
        semester: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedRules = rules.map((r) => ({
      id: r.id,
      semesterId: r.semesterId,
      title: r.title,
      description: r.content,
      content: r.content,
      category: r.category,
      status: r.status,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        rules: formattedRules,
      },
    });
  } catch (err) {
    console.error('Get Rules Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const createRule = async (req, res) => {
  try {
    const { semesterId, title, content, description, category, status } = req.body;

    if (!title || (!content && !description)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide title and content/description.',
      });
    }

    const newRule = await prisma.ruleRegulation.create({
      data: {
        semesterId: semesterId ? parseInt(semesterId) : null,
        title,
        content: content || description,
        category: category || 'General',
        status: status || 'active',
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        rule: newRule,
      },
    });
  } catch (err) {
    console.error('Create Rule Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { semesterId, title, content, description, category, status } = req.body;

    const data = {};
    if (semesterId !== undefined) data.semesterId = semesterId ? parseInt(semesterId) : null;
    if (title) data.title = title;
    if (content !== undefined || description !== undefined) data.content = content || description;
    if (category) data.category = category;
    if (status) data.status = status;

    const updatedRule = await prisma.ruleRegulation.update({
      where: { id: parseInt(id) },
      data,
    });

    res.status(200).json({
      status: 'success',
      data: {
        rule: updatedRule,
      },
    });
  } catch (err) {
    console.error('Update Rule Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ruleRegulation.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      status: 'success',
      message: 'Rule deleted successfully',
      data: null,
    });
  } catch (err) {
    console.error('Delete Rule Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
