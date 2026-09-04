import prisma from '../config/db.js';
import { buildSearchFilter, dateRangeFilter } from '../utils/helpers.js';

export async function createExpense(data, businessId) {
  try {
    return await prisma.expense.create({
      data: { ...data, businessId },
      include: { category: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function listExpenses(businessId, { page = 1, limit = 10, categoryId, startDate, endDate, search }) {
  try {
    const where = { businessId, ...buildSearchFilter(['description', 'reference'], search) };
    if (categoryId) where.categoryId = categoryId;
    Object.assign(where, dateRangeFilter('date', startDate, endDate));

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.expense.count({ where })
    ]);
    return { expenses, total, page, limit, totalPages: Math.ceil(total / limit) };
  } catch (err) {
    throw err;
  }
}

export async function getExpense(id, businessId) {
  try {
    return await prisma.expense.findFirst({
      where: { id, businessId },
      include: { category: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateExpense(id, businessId, data) {
  try {
    const existing = await prisma.expense.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Expense not found');
    return await prisma.expense.update({
      where: { id },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteExpense(id, businessId) {
  try {
    const existing = await prisma.expense.findFirst({ where: { id, businessId } });
    if (!existing) throw new Error('Expense not found');
    return await prisma.expense.delete({
      where: { id }
    });
  } catch (err) {
    throw err;
  }
}
