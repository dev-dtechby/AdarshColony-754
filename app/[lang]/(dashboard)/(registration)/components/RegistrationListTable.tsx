"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  Trash2,
  ChevronDown,
  FileText,
  Sheet,
} from "lucide-react";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

import {
  exportRegistrationToExcel,
  exportRegistrationToPDF,
} from "./ExportRegistration";
import { importRegistrationFromFile } from "./ImportRegistration";

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const REG_API = `${BASE_URL}/api/registration`;

/* ================= TYPES ================= */
type RegistrationRow = {
  id: string;
  registrationNo: string;
  date: string;
  headName: string;
  residentType: string;
  gender: string;
  blockNo: string;
  flatNo: string;
  mobileNo: string;
  whatsappNo?: string | null;
  totalMembers?: number | null;
  photoUrl?: string | null;
};

/* ================= HELPERS ================= */
function formatDate(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

export default function RegistrationListTable() {
  /* ================= STATE ================= */
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* ================= EXPORT ================= */
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  /* ================= IMPORT ================= */
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* ================= DELETE ================= */
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState("");
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);

  /* ================= LOAD DATA ================= */
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch(`${REG_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();
      setRows(Array.isArray(json) ? json : json?.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ================= EXPORT DROPDOWN OUTSIDE CLICK ================= */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!exportOpen) return;
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [exportOpen]);

  /* ================= FILTER ================= */
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.headName.toLowerCase().includes(q) ||
        r.blockNo.toLowerCase().includes(q) ||
        r.flatNo.toLowerCase().includes(q) ||
        r.mobileNo.includes(q)
    );
  }, [rows, query]);

  /* ================= SELECTION ================= */
  const allSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedIds.has(r.id));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) filteredRows.forEach((r) => next.delete(r.id));
      else filteredRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  /* ================= DELETE ================= */
  async function confirmSingleDelete() {
    try {
      setSingleDeleteLoading(true);
      await fetch(`${REG_API}/${singleDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setSingleDeleteOpen(false);
      setSingleDeleteId("");
      loadData();
    } finally {
      setSingleDeleteLoading(false);
    }
  }

  async function confirmBulkDelete() {
    try {
      setBulkDeleteLoading(true);
      for (const id of Array.from(selectedIds)) {
        await fetch(`${REG_API}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      loadData();
    } finally {
      setBulkDeleteLoading(false);
    }
  }

  /* ================= EXPORT ================= */
  const exportRows = useMemo(() => {
    const src =
      selectedIds.size > 0
        ? rows.filter((r) => selectedIds.has(r.id))
        : filteredRows;

    return src.map((r) => ({
      "Registration No": r.registrationNo,
      Date: formatDate(r.date),
      Name: r.headName,
      "Resident Type": r.residentType,
      Gender: r.gender,
      Block: r.blockNo,
      Flat: r.flatNo,
      Mobile: r.mobileNo,
      Whatsapp: r.whatsappNo || "",
      "Total Members": r.totalMembers ?? "",
    }));
  }, [rows, filteredRows, selectedIds]);

  function exportExcel() {
    setExportOpen(false);
    exportRegistrationToExcel(exportRows, "Registered_Members");
  }

  function exportPDF() {
    setExportOpen(false);
    exportRegistrationToPDF(exportRows, "Registered_Members", {
      title: "Adarsh Colony 754",
      subtitle: "Registered Members List",
    });
  }

  /* ================= IMPORT ================= */
  function triggerImport() {
    importInputRef.current?.click();
  }

  async function onImportFile(file?: File) {
    if (!file) return;
    const data = await importRegistrationFromFile(file);
    alert(`Imported ${data.length} rows (preview only).`);
  }

  /* ================= UI ================= */
  return (
    <Card className="p-4 md:p-6 border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Registered Members List
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search name / block / flat / mobile"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-[260px]"
            />

            {/* EXPORT */}
            <div ref={exportRef} className="relative">
              <Button
                variant="outline"
                className="h-9 flex items-center gap-2"
                disabled={!filteredRows.length}
                onClick={() => setExportOpen((p) => !p)}
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-lg z-50">
                  <button
                    type="button"
                    onClick={exportExcel}
                    className="w-full px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Sheet className="h-4 w-4" />
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportPDF}
                    className="w-full px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* IMPORT */}
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="h-9 flex items-center gap-2"
              onClick={triggerImport}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                {[
                  "Reg No",
                  "Date",
                  "Name",
                  "Type",
                  "Block",
                  "Flat",
                  "Mobile",
                  "Members",
                  "Photo",
                  "Action",
                ].map((h) => (
                  <th key={h} className="p-3 text-left whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-4 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : !filteredRows.length ? (
                <tr>
                  <td colSpan={10} className="p-4 text-muted-foreground">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleRow(r.id)}
                      />
                    </td>
                    <td className="p-3">{r.registrationNo}</td>
                    <td className="p-3">{formatDate(r.date)}</td>
                    <td className="p-3 font-medium">{r.headName}</td>
                    <td className="p-3">{r.residentType}</td>
                    <td className="p-3">{r.blockNo}</td>
                    <td className="p-3">{r.flatNo}</td>
                    <td className="p-3">{r.mobileNo}</td>
                    <td className="p-3">{r.totalMembers ?? "-"}</td>
                    <td className="p-3">
                      {r.photoUrl ? (
                        <a
                          href={r.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSingleDeleteId(r.id);
                          setSingleDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Bulk Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </CardContent>

      {/* CONFIRM DIALOGS */}
      <DeleteConfirmDialog
        open={singleDeleteOpen}
        title="Delete member?"
        description="This registration record will be permanently deleted."
        loading={singleDeleteLoading}
        onCancel={() => setSingleDeleteOpen(false)}
        onConfirm={confirmSingleDelete}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} members?`}
        description="Selected registration records will be permanently deleted."
        loading={bulkDeleteLoading}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </Card>
  );
}
