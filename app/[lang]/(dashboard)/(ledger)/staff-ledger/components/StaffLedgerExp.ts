import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= EXCEL EXPORT ================= */
export const exportStaffLedgerToExcel = (
  data: any[],
  ledgerName: string
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Staff Ledger"
  );

  XLSX.writeFile(
    workbook,
    `${ledgerName}-Ledger.xlsx`
  );
};

/* ================= PDF EXPORT ================= */
export const exportStaffLedgerToPDF = (
  data: any[],
  ledgerName: string
) => {
  const doc = new jsPDF("l", "mm", "a4");

  autoTable(doc, {
    head: [
      [
        "Date",
        "Site",
        "Expense",
        "Summary",
        "Remark",
        "Received (In)",
        "Payment (Out)",
        "Balance",
      ],
    ],
    body: data.map((row) => [
      row.Date,
      row.Site,
      row.Expense,
      row.Summary,
      row.Remark,
      row.In,
      row.Out,
      row.Balance,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [22, 163, 74], // green
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 55 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 25, halign: "right" },
    },
    margin: { top: 12 },
  });

  doc.save(`${ledgerName}-Ledger.pdf`);
};
