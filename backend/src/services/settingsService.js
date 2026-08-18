import prisma from '../config/db.js';

export async function getSettings(businessId) {
  try {
    // Get the business record
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    // Return object with business property (to match frontend expectations)
    return { business };
  } catch (err) {
    throw err;
  }
}

export async function updateSettings(businessId, data) {
  try {
    // The frontend sends { business: { ...businessData } }
    // We need to extract the business data and update the business record
    const businessData = data.business || data;
    
    // Update the business record
    const business = await prisma.business.update({
      where: { id: businessId },
      data: businessData
    });
    
    // Return object with business property
    return { business };
  } catch (err) {
    throw err;
  }
}

export async function getPermissions(businessId) {
  try {
    return await prisma.permission.findMany({
      where: { businessId },
      include: { role: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function updatePermissions(businessId, permissions) {
  try {
    return await prisma.permission.updateMany({
      where: { businessId },
      data: { permissions }
    });
  } catch (err) {
    throw err;
  }
}
