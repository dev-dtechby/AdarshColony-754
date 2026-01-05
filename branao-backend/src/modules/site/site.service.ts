import prisma from "../../lib/prisma";
import cloudinary from "../../config/cloudinary";

/* =====================================================
   CLOUDINARY UPLOAD
===================================================== */
async function uploadToCloudinary(file: Express.Multer.File) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "branao/sites" }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(file.buffer);
  });
}

/* =====================================================
   SMALL HELPERS (SAFE NORMALIZE)
===================================================== */
function toNullIfEmpty(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === "undefined" || s.toLowerCase() === "null") return null;
  return s;
}

function toNumberOrNull(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toNumberOrUndefined(val: any): number | undefined {
  if (val === undefined) return undefined;
  if (val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

/* =====================================================
   CREATE SITE
===================================================== */
export async function createSite(data: any, files: any) {
  const site = await prisma.site.create({
    data: {
      siteName: data.siteName,
      tenderNo: toNullIfEmpty(data.tenderNo),
      sdAmount: data.sdAmount ? toNumberOrNull(data.sdAmount) : null,

      // ✅ FIX: departmentId safe trim (existing behavior same: allow null)
      departmentId: toNullIfEmpty(data.departmentId),

      estimate: {
        create: {
          cement: toNumberOrNull(data.cement),
          metal: toNumberOrNull(data.metal),
          sand: toNumberOrNull(data.sand),
          labour: toNumberOrNull(data.labour),
          royalty: toNumberOrNull(data.royalty),
          overhead: toNumberOrNull(data.overhead),
          lead: toNumberOrNull(data.lead),
          dressing: toNumberOrNull(data.dressing),
          waterCompaction: toNumberOrNull(data.waterCompaction),
          loading: toNumberOrNull(data.loading),
        },
      },
    },
  });

  await uploadDocuments(site.id, files);
  return site;
}

/* =====================================================
   GET SITE BY ID (EDIT LOAD)
===================================================== */
export async function getSiteById(id: string) {
  const site = await prisma.site.findFirst({
    where: { id, isDeleted: false },
    include: {
      department: { select: { id: true, name: true } },
      estimate: true,
      documents: true,
    },
  });

  if (!site) return null;

  const getSingleDoc = (type: "SD" | "WORK_ORDER") =>
    site.documents.find((d) => d.type === type) || null;

  return {
    id: site.id,
    siteName: site.siteName,
    tenderNo: site.tenderNo,
    sdAmount: site.sdAmount,

    department: site.department,
    estimates: site.estimate, // 🔥 frontend uses this

    sdFile: getSingleDoc("SD"),
    workOrderFile: getSingleDoc("WORK_ORDER"),
    tenderDocs: site.documents.filter((d) => d.type === "TENDER"),
  };
}

/* =====================================================
   UPDATE SITE (EDIT SAVE)
===================================================== */
export async function updateSite(id: string, data: any, files: any) {
  await prisma.site.update({
    where: { id },
    data: {
      siteName: data.siteName,
      tenderNo: toNullIfEmpty(data.tenderNo),
      sdAmount: data.sdAmount ? toNumberOrNull(data.sdAmount) : null,

      // ✅ FIX: departmentId safe trim (existing behavior same: allow null)
      departmentId: toNullIfEmpty(data.departmentId),

      estimate: {
        update: {
          cement: toNumberOrUndefined(data.cement),
          metal: toNumberOrUndefined(data.metal),
          sand: toNumberOrUndefined(data.sand),
          labour: toNumberOrUndefined(data.labour),
          royalty: toNumberOrUndefined(data.royalty),
          overhead: toNumberOrUndefined(data.overhead),
          lead: toNumberOrUndefined(data.lead),
          dressing: toNumberOrUndefined(data.dressing),
          waterCompaction: toNumberOrUndefined(data.waterCompaction),
          loading: toNumberOrUndefined(data.loading),
        },
      },
    },
  });

  await uploadDocuments(id, files);
}

/* =====================================================
   UPLOAD DOCUMENTS (COMMON)
===================================================== */
async function uploadDocuments(siteId: string, files: any) {
  if (files?.sdFile?.length) {
    const r = await uploadToCloudinary(files.sdFile[0]);
    await prisma.siteDocument.create({
      data: {
        siteId,
        type: "SD",
        secureUrl: r.secure_url,
        publicId: r.public_id,
        resourceType: r.resource_type,
      },
    });
  }

  if (files?.workOrderFile?.length) {
    const r = await uploadToCloudinary(files.workOrderFile[0]);
    await prisma.siteDocument.create({
      data: {
        siteId,
        type: "WORK_ORDER",
        secureUrl: r.secure_url,
        publicId: r.public_id,
        resourceType: r.resource_type,
      },
    });
  }

  if (files?.tenderDocs?.length) {
    for (const file of files.tenderDocs) {
      const r = await uploadToCloudinary(file);
      await prisma.siteDocument.create({
        data: {
          siteId,
          type: "TENDER",
          secureUrl: r.secure_url,
          publicId: r.public_id,
          resourceType: r.resource_type,
        },
      });
    }
  }
}
