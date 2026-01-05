import prisma from "../../lib/prisma";

const SUPPLIER_LEDGER_TYPE = "MATERIAL_SUPPLIER";

/* =========================
   Helpers
========================= */
async function getSupplierLedgerTypeId() {
  const existing = await prisma.ledgerType.findUnique({
    where: { name: SUPPLIER_LEDGER_TYPE },
  });

  if (existing) return existing.id;

  const created = await prisma.ledgerType.create({
    data: { name: SUPPLIER_LEDGER_TYPE },
  });

  return created.id;
}

function cleanStr(v: any) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

/* =========================
   CREATE Supplier (as Ledger)
========================= */
export const createMaterialSupplier = async (
  data: {
    name: string;
    address?: string;
    mobile?: string;
    remark?: string;
  },
  userId?: string,
  ip?: string
) => {
  const name = cleanStr(data?.name);
  if (!name) throw new Error("name is required");

  const ledgerTypeId = await getSupplierLedgerTypeId();

  const created = await prisma.ledger.create({
    data: {
      ledgerTypeId,
      name: String(name),
      address: cleanStr(data.address),
      mobile: cleanStr(data.mobile),
      remark: cleanStr(data.remark),

      // supplier is global party, not site-based
      siteId: null,

      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MaterialSupplier",
      recordId: created.id,
      action: "CREATE",
      newData: created as any,
      ip,
    },
  });

  return created;
};

/* =========================
   READ Active Suppliers
========================= */
export const getAllMaterialSuppliers = async () => {
  const ledgerTypeId = await getSupplierLedgerTypeId();

  return prisma.ledger.findMany({
    where: {
      ledgerTypeId,
      isDeleted: false,
    },
    orderBy: { name: "asc" },
  });
};

/* =========================
   READ Deleted Suppliers
========================= */
export const getDeletedMaterialSuppliers = async () => {
  const ledgerTypeId = await getSupplierLedgerTypeId();

  return prisma.ledger.findMany({
    where: {
      ledgerTypeId,
      isDeleted: true,
    },
    orderBy: { deletedAt: "desc" },
  });
};

/* =========================
   UPDATE Supplier
========================= */
export const updateMaterialSupplier = async (
  id: string,
  data: {
    name?: string;
    address?: string;
    mobile?: string;
    remark?: string;
  },
  userId?: string,
  ip?: string
) => {
  if (!id) throw new Error("id is required");

  const oldData = await prisma.ledger.findUnique({ where: { id } });
  if (!oldData) throw new Error("Supplier not found");

  const patch: any = {};
  if (data.name !== undefined) {
    const n = cleanStr(data.name);
    if (!n) throw new Error("name cannot be empty");
    patch.name = String(n);
  }
  if (data.address !== undefined) patch.address = cleanStr(data.address);
  if (data.mobile !== undefined) patch.mobile = cleanStr(data.mobile);
  if (data.remark !== undefined) patch.remark = cleanStr(data.remark);

  const updated = await prisma.ledger.update({
    where: { id },
    data: patch,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MaterialSupplier",
      recordId: id,
      action: "UPDATE",
      oldData: oldData as any,
      newData: updated as any,
      ip,
    },
  });

  return updated;
};

/* =========================
   SOFT DELETE Supplier
========================= */
export const softDeleteMaterialSupplier = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  if (!id) throw new Error("id is required");

  const oldData = await prisma.ledger.findUnique({ where: { id } });
  if (!oldData) throw new Error("Supplier not found");

  const deleted = await prisma.ledger.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MaterialSupplier",
      recordId: id,
      action: "DELETE",
      oldData: oldData as any,
      newData: deleted as any,
      ip,
    },
  });

  return deleted;
};

/* =========================
   RESTORE Supplier
========================= */
export const restoreMaterialSupplier = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  if (!id) throw new Error("id is required");

  const oldData = await prisma.ledger.findUnique({ where: { id } });
  if (!oldData) throw new Error("Supplier not found");

  const restored = await prisma.ledger.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MaterialSupplier",
      recordId: id,
      action: "RESTORE",
      oldData: oldData as any,
      newData: restored as any,
      ip,
    },
  });

  return restored;
};

/* =========================
   HARD DELETE Supplier
========================= */
export const hardDeleteMaterialSupplier = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  if (!id) throw new Error("id is required");

  const oldData = await prisma.ledger.findUnique({ where: { id } });
  if (!oldData) throw new Error("Supplier not found");

  await prisma.ledger.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "MaterialSupplier",
      recordId: id,
      action: "HARD_DELETE",
      oldData: oldData as any,
      ip,
    },
  });

  return true;
};
