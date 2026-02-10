// ImportRegistration.tsx

import * as XLSX from "xlsx";

/* ================= TYPES ================= */
export type ImportedRegistrationRow = {
  registrationNo?: string;
  date?: string;
  headName?: string;
  residentType?: string;
  blockNo?: string;
  flatNo?: string;
  mobileNo?: string;
  whatsappNo?: string;
  totalMembers?: number;
};

/* ================= IMPORT FUNCTION ================= */
export async function importRegistrationFromFile(
  file: File
): Promise<ImportedRegistrationRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json<ImportedRegistrationRow>(worksheet, {
          defval: "",
          raw: false,
        });

        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsArrayBuffer(file);
  });
}
