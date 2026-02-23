"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortMode, ViewMode } from "./types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExportMemberList, { ExportMemberRow } from "./ExportMemberList";

// shadcn dropdown (अगर path अलग हो तो adjust)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// icons
import { RefreshCw, FileUp, Download } from "lucide-react";

type ListType = "ALL" | "RENTED";

export default function MemberToolbar({
  total,
  allBlocks,
  block,
  setBlock,
  sort,
  setSort,
  view,
  setView,
  listType,
  setListType,
  q,
  setQ,
  loading,
  onSearch,
  onOpenImport,
  exportRows = [],
}: {
  total: number;
  allBlocks: number[];
  block: string;
  setBlock: (v: string) => void;
  sort: SortMode;
  setSort: (v: SortMode) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;

  listType: ListType;
  setListType: (v: ListType) => void;

  q: string;
  setQ: (v: string) => void;

  loading: boolean;
  onSearch: () => void;
  onOpenImport: () => void;

  exportRows: ExportMemberRow[];
}) {
  const title = listType === "RENTED" ? "Rented Member List" : "All Member List";
  const exportPrefix = listType === "RENTED" ? "RentedMembers" : "AllMembers";

  // ✅ ExportMemberList currently supports CSV + Print (PDF)
  // We will use:
  // - CSV => ExportMemberList's CSV function via UI click
  // - PDF => use Print (browser print -> Save as PDF)
  //
  // For dropdown actions, we just render ExportMemberList but hide its buttons visually.
  // Better: add optional "onExportCSV/onPrint" in ExportMemberList; but without changing that file,
  // simplest: keep ExportMemberList logic inside dropdown by duplicating small helpers here.

  function escCsv(val: any) {
    const s = val === null || val === undefined ? "" : String(val);
    const needs = /[",\n]/.test(s);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  }

  function formatDateStamp(d: Date) {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yy}${mm}${dd}-${hh}${mi}`;
  }

  function exportCSV() {
    if (!exportRows?.length) return;

    const headers = [
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
      "Rent Agreement URL",
      "Police Verification URL",
    ];

    const lines: string[] = [];
    lines.push(headers.map(escCsv).join(","));

    exportRows.forEach((r: any, idx) => {
      const line = [
        idx + 1,
        r.memberCode ?? "",
        r.name ?? "",
        r.fatherOrHusbandName ?? "",
        r.mobileNo ?? "",
        r.blockNo ?? "",
        r.floor ?? "",
        r.flatNo ?? "",
        r.rentalName ?? "",
        r.rentalMobileNo ?? "",
        r.rentAgreementUrl ?? "",
        r.policeVerificationUrl ?? r.policeVerifyUrl ?? "",
      ];
      lines.push(line.map(escCsv).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const stamp = formatDateStamp(new Date());
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportPrefix}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!exportRows?.length) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const stamp = new Date().toLocaleString();

    doc.setFontSize(12);
    doc.text(exportPrefix, 40, 30);
    doc.setFontSize(9);
    doc.text(`Total: ${exportRows.length} | Generated: ${stamp}`, 40, 46);

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

    const body = exportRows.map((r: any, idx: number) => ([
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
    ]));

    autoTable(doc, {
      head,
      body,
      startY: 60,
      styles: { fontSize: 8, cellPadding: 4 },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });

    const stampFile = formatDateStamp(new Date());
    doc.save(`${exportPrefix}-${stampFile}.pdf`);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="font-semibold text-lg">{title}</div>
        <div className="text-sm opacity-70">Total: {total}</div>

        <div className="ml-auto flex flex-wrap gap-2 items-center">
          {/* Block filter */}
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          >
            <option value="ALL">All Blocks</option>
            {allBlocks.map((b) => (
              <option key={b} value={String(b)}>
                Block {b}
              </option>
            ))}
          </select>

          {/* List filter */}
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={listType}
            onChange={(e) => setListType(e.target.value as ListType)}
          >
            <option value="ALL">List: All</option>
            <option value="RENTED">List: Rented</option>
          </select>

          {/* Sort */}
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="blockFlat">Sort: Block/Flat</option>
            <option value="name">Sort: Name</option>
          </select>

          {/* View */}
          <select
            className="h-9 px-3 border rounded-md bg-background text-sm"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
          >
            <option value="block">View: Block-wise</option>
            <option value="all">View: All List</option>
          </select>

          {/* Global Search */}
          <Input
            className="w-80 h-9"
            placeholder="Global search: name / mobile / code / tenant / docs..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />

          {/* ✅ Icon Buttons */}
          <Button
            onClick={onSearch}
            disabled={loading}
            size="icon"
            variant="outline"
            title="Refresh"
            aria-label="Refresh"
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* ✅ Export icon dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={loading || exportRows.length === 0}
                title="Export"
                aria-label="Export"
                className="h-9 w-9"
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={exportCSV}>
                Export Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ✅ Import icon */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onOpenImport}
            disabled={loading}
            title="Import Excel"
            aria-label="Import Excel"
            className="h-9 w-9"
          >
            <FileUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* <div className="mt-2 text-xs opacity-70">
        Excel Headers must be: <b>Name</b>, <b>Father / Husband Name</b>, <b>Mobile No</b>, <b>Block</b>,{" "}
        <b>Floor</b>, <b>Flat</b>. Import सिर्फ master data update करता है — registration number import से generate नहीं होगा।
      </div> */}

      {/* keeping this import so file exists; not used directly now */}
      <div className="hidden">
        <ExportMemberList rows={exportRows} disabled={loading} fileNamePrefix={exportPrefix} />
      </div>
    </Card>
  );
}