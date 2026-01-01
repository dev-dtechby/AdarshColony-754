import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= EXCEL EXPORT ================= */
export const exportSiteListToExcel = (
  data: any[],
  fileName: string
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "All Sites"
  );

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT ================= */
export const exportSiteListToPDF = (
  data: any[],
  fileName: string
) => {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape

  autoTable(doc, {
    head: [
      [
        "Site Name",
        "Tender No",
        "Department",
        "SD Amount",
        "SD URL",
        "Work Order URL",
        "Tender Docs URL",
      ],
    ],
    body: data.map((row) => [
      row["Site Name"],
      row["Tender No"],
      row["Department"],
      row["SD Amount"],
      row["SD URL"],
      row["Work Order URL"],
      row["Tender Docs URL"],
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    margin: { top: 12 },
  });

  doc.save(`${fileName}.pdf`);
};
