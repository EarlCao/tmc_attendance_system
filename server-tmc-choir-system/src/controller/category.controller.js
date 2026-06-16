import { prisma } from '../lib/prisma.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.evaluationCategory.findMany({
      orderBy: { name: 'asc' },
    });
    // Surface a non-blocking warning when the weights don't sum to 100% — the
    // weighted-average computation divides by the total weight, so a sum other
    // than 100 produces misleading "averages".
    const totalPercentage = categories.reduce((sum, c) => sum + (c.percentage || 0), 0);
    const percentageWarning =
      categories.length > 0 && Math.round(totalPercentage) !== 100
        ? `Category percentages sum to ${totalPercentage}%, not 100%. Weighted averages may be misleading.`
        : null;
    res.status(200).json({ status: 'success', data: { categories, totalPercentage, percentageWarning } });
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
    if (percentage !== undefined && percentage !== null && percentage !== '') {
      const pct = parseFloat(percentage);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ status: 'fail', message: 'Percentage must be a number between 0 and 100.' });
      }
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
    if (percentage !== undefined) {
      const pct = parseFloat(percentage);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ status: 'fail', message: 'Percentage must be a number between 0 and 100.' });
      }
      data.percentage = pct;
    }
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
