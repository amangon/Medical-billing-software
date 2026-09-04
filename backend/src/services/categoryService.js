import prisma from '../config/db.js';

export async function createCategory(data, businessId) {
  try {
    return await prisma.category.create({
      data: { ...data, businessId }
    });
  } catch (err) {
    throw err;
  }
}

export async function listCategories(businessId) {
  try {
    return await prisma.category.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    throw err;
  }
}

export async function getCategory(id, businessId) {
  try {
    return await prisma.category.findFirst({
      where: { id, businessId },
      include: { products: true }
    });
  } catch (err) {
    throw err;
  }
}

export async function updateCategory(id, businessId, data) {
  try {
    return await prisma.category.update({
      where: { id_businessId: { id, businessId } },
      data
    });
  } catch (err) {
    throw err;
  }
}

export async function deleteCategory(id, businessId) {
  try {
    return await prisma.category.delete({
      where: { id_businessId: { id, businessId } }
    });
  } catch (err) {
    throw err;
  }
}
