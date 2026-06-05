import { prisma } from '../lib/prisma.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.evaluationCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (err) {
    console.error('Get Categories Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, percentage } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ status: 'fail', message: 'Category name is required.' });
    }
    const category = await prisma.evaluationCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        percentage: parseFloat(percentage) || 0,
      },
    });
    res.status(201).json({ status: 'success', data: { category } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'A category with that name already exists.' });
    }
    console.error('Create Category Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, percentage } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (percentage !== undefined) data.percentage = parseFloat(percentage);
    const category = await prisma.evaluationCategory.update({
      where: { id: parseInt(id) },
      data,
    });
    res.status(200).json({ status: 'success', data: { category } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'A category with that name already exists.' });
    }
    console.error('Update Category Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const scoreCount = await prisma.evaluationScore.count({
      where: { categoryId: parseInt(id) },
    });
    if (scoreCount > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete: this category has ${scoreCount} existing score(s) tied to audition evaluations.`,
      });
    }
    await prisma.evaluationCategory.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ status: 'success', message: 'Category deleted.', data: null });
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
