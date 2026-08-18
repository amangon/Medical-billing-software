import {
  getSettings as getSettingsService,
  updateSettings as updateSettingsService
} from '../services/settingsService.js';
import prisma from '../config/db.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await getSettingsService(req.user.businessId);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await updateSettingsService(req.user.businessId, req.body);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const getUserPermissions = async (req, res, next) => {
  try {
    const permissions = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { permissions: true }
    });
    res.json(permissions);
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { permissions },
      select: { id: true, email: true, name: true, role: true, permissions: true }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};
