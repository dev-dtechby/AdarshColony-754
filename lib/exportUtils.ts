import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= CSV ================= */
export const exportToCSV = (data: any[], fileName: string) => {
  const headers = Object.keys(data[0] || {});
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => `"${row[h] ?? ""}"`).join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  downloadBlob(blob, `${fileName}.csv`);
};

/* ================= EXCEL ================= */
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Site Expenses");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF ================= */
export const exportToPDF = (data: any[], fileName: string) => {
  const doc = new jsPDF();

  const columns = Object.keys(data[0] || {}).map(key => ({
    header: key.toUpperCase(),
    dataKey: key,
  }));

  autoTable(doc, {
    columns,
    body: data,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${fileName}.pdf`);
};

/* ================= HELPER ================= */
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
