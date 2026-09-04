import {
  createExpense as createExpenseSvc,
  listExpenses as getExpensesSvc,
  getExpense as getExpenseSvc,
  updateExpense as updateExpenseSvc,
  deleteExpense as deleteExpenseSvc
} from '../services/expenseService.js';

export const createExpense = async (req, res, next) => {
  try {
    const expense = await createExpenseSvc(req.body, req.user.businessId);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate, search } = req.query;
    const result = await getExpensesSvc(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      startDate,
      endDate,
      search
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req, res, next) => {
  try {
    const expense = await getExpenseSvc(req.params.id, req.user.businessId);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await updateExpenseSvc(req.params.id, req.user.businessId, req.body);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const result = await deleteExpenseSvc(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
