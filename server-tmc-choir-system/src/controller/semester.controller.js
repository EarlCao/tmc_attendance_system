import { prisma } from '../lib/prisma.js';

export const getSemesters = async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.status(200).json({
      status: 'success',
      data: {
        semesters,
      },
    });
  } catch (err) {
    console.error('Get Semesters Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const createSemester = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    // if (!name || !startDate || !endDate) {
    //   return res.status(400).json({
    //     status: 'fail',
    //     message: 'Please provide name, startDate and endDate',
    //   });
    // }

    const newSemester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        semester: newSemester,
      },
    });
  } catch (err) {
    console.error('Create Semester Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

export const endSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedSemester = await prisma.semester.update({
      where: { id: parseInt(id) },
      data: { endDate: new Date() },
    });

    res.status(200).json({
      status: 'success',
      data: {
        semester: updatedSemester,
      },
    });
  } catch (err) {
    console.error('End Semester Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}