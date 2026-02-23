"use client";

import { Button } from "@/components/ui/button";

export type ExportMemberRow = {
  serialNo?: number | null;
  memberCode?: string | null;
  name?: string | null;
  fatherOrHusbandName?: string | null;
  mobileNo?: string | null;
  blockNo?: number | null;
  floor?: string | null;
  flatNo?: number | null;

  rentalName?: string | null;
  rentalMobileNo?: string | null;
  rentAgreementUrl?: string | null;

  policeVerificationUrl?: string | null;
  policeVerifyUrl?: string | null; // alias support
};

function formatDateStamp(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}${mm}${dd}-${hh}${mi}`;
}

function escapeHtml(s: any) {
  const str = s === null || s === undefined ? "" : String(s);
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPrintHtml(title: string, rows: ExportMemberRow[], stamp: string) {
  const htmlRows = rows
    .map((r, idx) => {
      const policeUrl = r.policeVerificationUrl ?? (r as any).policeVerifyUrl ?? "";
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(r.memberCode ?? "-")}</td>
          <td>${escapeHtml(r.name ?? "-")}</td>
          <td>${escapeHtml(r.fatherOrHusbandName ?? "-")}</td>
          <td>${escapeHtml(r.mobileNo ?? "-")}</td>
          <td>${escapeHtml(r.blockNo ?? "-")}</td>
          <td>${escapeHtml(r.floor ?? "-")}</td>
          <td>${escapeHtml(r.flatNo ?? "-")}</td>
          <td>${escapeHtml(r.rentalName ?? "-")}</td>
          <td>${escapeHtml(r.rentalMobileNo ?? "-")}</td>
          <td>${r.rentAgreementUrl ? "Yes" : "-"}</td>
          <td>${policeUrl ? "Yes" : "-"}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h2 { margin: 0 0 6px 0; }
          .meta { color: #555; font-size: 12px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>${escapeHtml(title)}</h2>
        <div class="meta">Total: ${rows.length} | Generated: ${escapeHtml(stamp)}</div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Member Code</th>
              <th>Name</th>
              <th>Father/Husband</th>
              <th>Mobile</th>
              <th>Block</th>
              <th>Floor</th>
              <th>Flat</th>
              <th>Tenant Name</th>
              <th>Tenant Mobile</th>
              <th>Rent Agreement</th>
              <th>Police Verification</th>
            </tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function printViaIframe(html: string) {
  const iframe = document.createElement("iframe");

  // ✅ Edge-friendly: 0 size / visibility hidden नहीं
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;

  if (!win || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {}
  };

  // print के बाद cleanup
  win.onafterprint = cleanup;

  // ✅ थोड़ा delay ताकि content render हो जाए
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
    }
  }, 800);

  // fallback cleanup
  setTimeout(cleanup, 8000);
}

export default function ExportMemberList({
  rows,
  disabled,
  fileNamePrefix = "MemberList",
}: {
  rows: ExportMemberRow[];
  disabled?: boolean;
  fileNamePrefix?: string;
}) {
  const canExport = !disabled && Array.isArray(rows) && rows.length > 0;

  async function exportExcel() {
    if (!canExport) return;

    // ✅ dynamic import (bundle size कम)
    const XLSX = await import("xlsx");

    const data = rows.map((r: any, idx) => ({
      "S.No": idx + 1,
      "Member Code": r.memberCode ?? "",
      Name: r.name ?? "",
      "Father/Husband": r.fatherOrHusbandName ?? "",
      Mobile: r.mobileNo ?? "",
      Block: r.blockNo ?? "",
      Floor: r.floor ?? "",
      Flat: r.flatNo ?? "",
      "Tenant Name": r.rentalName ?? "",
      "Tenant Mobile": r.rentalMobileNo ?? "",
      "Rent Agreement URL": r.rentAgreementUrl ?? "",
      "Police Verification URL": r.policeVerificationUrl ?? r.policeVerifyUrl ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const stamp = formatDateStamp(new Date());
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNamePrefix}-${stamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

    async function exportPDF() {
    if (!canExport) return;

    const jsPDFMod = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");

    // jsPDF default export
    const doc = new jsPDFMod.default({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
    });

    const stamp = new Date().toLocaleString();

    doc.setFontSize(12);
    doc.text(fileNamePrefix, 40, 30);
    doc.setFontSize(9);
    doc.text(`Total: ${rows.length} | Generated: ${stamp}`, 40, 46);

    const head = [[
        "S.No",
        "Member Code",
        "Name",
        "Father/Husband",
        "Mobile",
        "Block",
        "Floor",
        "Flat",
        "Tenant Name",
        "Tenant Mobile",
        "Rent Agr.",
        "Police Ver.",
    ]];

    const body = rows.map((r: any, idx) => [
        String(idx + 1),
        r.memberCode ?? "",
        r.name ?? "",
        r.fatherOrHusbandName ?? "",
        r.mobileNo ?? "",
        String(r.blockNo ?? ""),
        r.floor ?? "",
        String(r.flatNo ?? ""),
        r.rentalName ?? "",
        r.rentalMobileNo ?? "",
        r.rentAgreementUrl ? "Yes" : "-",
        (r.policeVerificationUrl ?? r.policeVerifyUrl) ? "Yes" : "-",
    ]);

    // @ts-ignore
    autoTableMod.default(doc, {
        head,
        body,
        startY: 60,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fontSize: 8 },
        margin: { left: 40, right: 40 },
        theme: "grid",
    });

    const stampFile = formatDateStamp(new Date());
    doc.save(`${fileNamePrefix}-${stampFile}.pdf`);
    }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" disabled={!canExport} onClick={exportExcel}>
        Export Excel
      </Button>
      <Button type="button" variant="outline" disabled={!canExport} onClick={exportPDF}>
        Export PDF
      </Button>
    </div>
  );
}