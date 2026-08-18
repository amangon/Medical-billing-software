import {
  getBusiness as getBusinessService,
  updateBusiness as updateBusinessService,
  getBusinessStats as getBusinessStatsService
} from '../services/businessService.js';

export const getBusiness = async (req, res, next) => {
  try {
    const business = await getBusinessService(req.user.businessId);
    res.json(business);
  } catch (error) {
    next(error);
  }
};

export const updateBusiness = async (req, res, next) => {
  try {
    const business = await updateBusinessService(req.user.businessId, req.body);
    res.json(business);
  } catch (error) {
    next(error);
  }
};

export const getBusinessStats = async (req, res, next) => {
  try {
    const stats = await getBusinessStatsService(req.user.businessId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
