import prisma from "../../lib/prisma";

/* ================================
   GET ALL ACTIVE DEPARTMENTS
================================ */
export const getAllDepartments = async () => {
  return prisma.department.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });
};

/* ================================
   GET ALL DELETED DEPARTMENTS
================================ */
export const getDeletedDepartments = async () => {
  return prisma.department.findMany({
    where: {
      isDeleted: true,
    },
    orderBy: {
      deletedAt: "desc",
    },
  });
};

/* ================================
   CREATE DEPARTMENT
================================ */
export const createDepartment = async (name: string) => {
  if (!name || !name.trim()) {
    throw new Error("Department name is required");
  }

  // duplicate check (active only)
  const existing = await prisma.department.findFirst({
    where: {
      name: name.trim(),
      isDeleted: false,
    },
  });

  if (existing) {
    throw new Error("Department already exists");
  }

  return prisma.department.create({
    data: {
      name: name.trim(),
    },
  });
};

/* ================================
   ✅ UPDATE DEPARTMENT
================================ */
export const updateDepartment = async (id: string, name: string) => {
  if (!id) throw new Error("Department id is required");
  if (!name || !name.trim()) throw new Error("Department name is required");

  // ensure department exists (active)
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw new Error("Department not found");
  if (dept.isDeleted) throw new Error("Cannot update a deleted department");

  // duplicate check (active only, excluding current)
  const dup = await prisma.department.findFirst({
    where: {
      name: name.trim(),
      isDeleted: false,
      NOT: { id },
    },
  });

  if (dup) {
    throw new Error("Department already exists");
  }

  return prisma.department.update({
    where: { id },
    data: {
      name: name.trim(),
    },
  });
};

/* ================================
   SOFT DELETE DEPARTMENT
   (DEFAULT DELETE)
================================ */
export const softDeleteDepartment = async (id: string) => {
  return prisma.department.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

/* ================================
   RESTORE DEPARTMENT
================================ */
export const restoreDepartment = async (id: string) => {
  return prisma.department.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
};

/* ================================
   HARD DELETE DEPARTMENT
   (PERMANENT – ADMIN ONLY)
================================ */
export const hardDeleteDepartment = async (id: string) => {
  return prisma.department.delete({
    where: { id },
  });
};
