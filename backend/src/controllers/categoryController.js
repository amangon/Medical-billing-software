import {
  createCategory as createCategorySvc,
  listCategories as getCategoriesSvc,
  getCategory as getCategorySvc,
  updateCategory as updateCategorySvc,
  deleteCategory as deleteCategorySvc
} from '../services/categoryService.js';

export const createCategory = async (req, res, next) => {
  try {
    const category = await createCategorySvc(req.body, req.user.businessId);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const result = await getCategoriesSvc(req.user.businessId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await getCategorySvc(req.params.id, req.user.businessId);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await updateCategorySvc(req.params.id, req.user.businessId, req.body);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const result = await deleteCategorySvc(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
