import prisma from '../config/db.js';

export async function getBusiness(businessId) {
  try {
    return await prisma.business.findUnique({
      where: { id: businessId },
      include: { users: { select: { name: true, email: true } } }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateBusiness(businessId, data) {
  try {
    return await prisma.business.update({
      where: { id: businessId },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function getBusinessStats(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            products: true,
            customers: true,
            suppliers: true,
            orders: true,
            invoices: true,
            purchases: true
          }
        }
      }
    });
    return business;
  } catch (err) {
    throw err;
  }
}
