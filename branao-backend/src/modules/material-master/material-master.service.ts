import prisma from "../../lib/prisma";

// ✅ Prisma error helper
function prismaMsg(e: any) {
  const code = e?.code as string | undefined;

  // Unique constraint
  if (code === "P2002") return "Material name already exists.";

  // Record not found
  if (code === "P2025") return "Record not found.";

  return e?.message || "Operation failed";
}

export const materialMasterService = {
  getActive: async () => {
    return prisma.materialMaster.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },

  getDeleted: async () => {
    return prisma.materialMaster.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    });
  },

  create: async (name: string) => {
    const clean = String(name || "").trim();
    if (!clean) throw new Error("Material name required");

    try {
      return await prisma.materialMaster.create({
        data: { name: clean },
      });
    } catch (e: any) {
      // ✅ If duplicate, check if exists in deleted and suggest restore
      if (e?.code === "P2002") {
        const deleted = await prisma.materialMaster.findFirst({
          where: { name: clean, isDeleted: true },
          select: { id: true },
        });

        if (deleted?.id) {
          throw new Error(
            "Material already exists in Deleted Records. Please restore it instead of creating new."
          );
        }
      }
      throw new Error(prismaMsg(e));
    }
  },

  update: async (id: string, name: string) => {
    const cleanId = String(id || "").trim();
    const cleanName = String(name || "").trim();

    if (!cleanId) throw new Error("Id required");
    if (!cleanName) throw new Error("Material name required");

    try {
      // ✅ Ensure record exists (nice message)
      const exists = await prisma.materialMaster.findUnique({
        where: { id: cleanId },
        select: { id: true, isDeleted: true },
      });
      if (!exists) throw new Error("Material not found");
      if (exists.isDeleted)
        throw new Error("This material is deleted. Restore first to update.");

      return await prisma.materialMaster.update({
        where: { id: cleanId },
        data: { name: cleanName },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        const deleted = await prisma.materialMaster.findFirst({
          where: { name: cleanName, isDeleted: true },
          select: { id: true },
        });

        if (deleted?.id) {
          throw new Error(
            "Same name exists in Deleted Records. Please restore that record or choose another name."
          );
        }
      }
      throw new Error(prismaMsg(e));
    }
  },

  softDelete: async (id: string, deletedBy?: string | null) => {
    const cleanId = String(id || "").trim();
    if (!cleanId) throw new Error("Id required");

    try {
      // ✅ Already deleted? no crash
      const exists = await prisma.materialMaster.findUnique({
        where: { id: cleanId },
        select: { id: true, isDeleted: true },
      });
      if (!exists) throw new Error("Material not found");
      if (exists.isDeleted) return;

      return await prisma.materialMaster.update({
        where: { id: cleanId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy || null,
        },
      });
    } catch (e: any) {
      throw new Error(prismaMsg(e));
    }
  },

  restore: async (id: string) => {
    const cleanId = String(id || "").trim();
    if (!cleanId) throw new Error("Id required");

    try {
      const exists = await prisma.materialMaster.findUnique({
        where: { id: cleanId },
        select: { id: true, isDeleted: true },
      });
      if (!exists) throw new Error("Material not found");
      if (!exists.isDeleted) return await prisma.materialMaster.findUnique({ where: { id: cleanId } });

      return await prisma.materialMaster.update({
        where: { id: cleanId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch (e: any) {
      throw new Error(prismaMsg(e));
    }
  },

  hardDelete: async (id: string) => {
    const cleanId = String(id || "").trim();
    if (!cleanId) throw new Error("Id required");

    try {
      return await prisma.materialMaster.delete({
        where: { id: cleanId },
      });
    } catch (e: any) {
      throw new Error(prismaMsg(e));
    }
  },
};
