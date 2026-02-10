// ExportRegistration.tsx

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= TYPES ================= */
export type ExportRegistrationRow = {
  [key: string]: any;
};

/* ================= EXCEL EXPORT ================= */
export function exportRegistrationToExcel(
  rows: ExportRegistrationRow[],
  fileName: string = "Registration_List"
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Members");

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/* ================= PDF EXPORT ================= */
export function exportRegistrationToPDF(
  rows: ExportRegistrationRow[],
  fileName: string = "Registration_List",
  meta?: {
    title?: string;
    subtitle?: string;
  }
) {
  const doc = new jsPDF("l", "mm", "a4");

  const title = meta?.title || "Registered Members List";
  const subtitle = meta?.subtitle || "";

  doc.setFontSize(14);
  doc.text(title, 14, 12);

  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 18);
  }

  const headers = rows.length ? Object.keys(rows[0]) : [];
  const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

  autoTable(doc, {
    head: [headers],
    body,
    startY: subtitle ? 22 : 18,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 20,
      fontStyle: "bold",
    },
    theme: "grid",
  });

  doc.save(`${fileName}.pdf`);
}
