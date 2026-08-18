import prisma from '../config/db.js';

export async function createBrand(data, businessId) {
  try {
    return await prisma.brand.create({
      data: { ...data, businessId }
    });
  } catch (err) {
    throw err;
  }
}

export async function listBrands(businessId) {
  try {
    return await prisma.brand.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function getBrand(id, businessId) {
  try {
    return await prisma.brand.findFirst({
      where: { id, businessId },
      include: { products: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateBrand(id, businessId, data) {
  try {
    return await prisma.brand.update({
      where: { id_businessId: { id, businessId } },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteBrand(id, businessId) {
  try {
    return await prisma.brand.delete({
      where: { id_businessId: { id, businessId } }
    });
  } catch (err) {
    throw err;
  }
}
