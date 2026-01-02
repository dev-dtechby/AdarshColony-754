import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= EXCEL EXPORT ================= */
export const exportLedgerListToExcel = (
  data: any[],
  fileName: string
) => {
  const formattedData = data.map((row) => ({
    "Site": row.site?.siteName || "-",
    "Ledger Type": row.ledgerType?.name || "-",
    "Party / Ledger Name": row.name,
    "Opening Balance": row.openingBalance ?? "",
    "Closing Balance": row.closingBalance ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Ledger List"
  );

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT ================= */
export const exportLedgerListToPDF = (
  data: any[],
  fileName: string
) => {
  const doc = new jsPDF("l", "mm", "a4");

  autoTable(doc, {
    head: [[
      "Site",
      "Ledger Type",
      "Party / Ledger Name",
      "Opening Balance",
      "Closing Balance",
    ]],

    body: data.map((row) => [
      row.site?.siteName || "-",
      row.ledgerType?.name || "-",
      row.name,
      row.openingBalance ?? "",
      row.closingBalance ?? "",
    ]),

    styles: {
      fontSize: 9,
      cellPadding: 4,
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
