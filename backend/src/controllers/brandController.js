import {
  createBrand as createBrandSvc,
  listBrands as getBrandsSvc,
  getBrand as getBrandSvc,
  updateBrand as updateBrandSvc,
  deleteBrand as deleteBrandSvc
} from '../services/brandService.js';

export const createBrand = async (req, res, next) => {
  try {
    const brand = await createBrandSvc(req.body, req.user.businessId);
    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const result = await getBrandsSvc(req.user.businessId, {
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

export const getBrand = async (req, res, next) => {
  try {
    const brand = await getBrandSvc(req.params.id, req.user.businessId);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const brand = await updateBrandSvc(req.params.id, req.user.businessId, req.body);
    res.json(brand);
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const result = await deleteBrandSvc(req.params.id, req.user.businessId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
