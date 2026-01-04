"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";
import EditStaffLedger from "./EditStaffLedger";
import { StaffExpense } from "./types";
import { exportStaffLedgerToExcel, exportStaffLedgerToPDF } from "./StaffLedgerExp";

// ✅ NEW import helper
import { importStaffLedgerExcel } from "./StaffLedgerImport";
import { useToast } from "@/components/ui/use-toast";

/* ================= TYPES ================= */
interface Ledger {
  id: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  ledgerType?: { name: string } | null;
}

/* ================= API BASE ================= */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function StaffLedgerTable() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState<"exp" | "received" | null>(null);

  const [staffLedgers, setStaffLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);

  const [entries, setEntries] = useState<StaffExpense[]>([]);
  const [loading, setLoading] = useState(false);

  const [editRow, setEditRow] = useState<StaffExpense | null>(null);

  const [showExport, setShowExport] = useState(false);

  // ✅ Export dropdown close on outside click
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

  // ✅ IMPORT STATES (ONLY ADDITION)
  const [openImportGuide, setOpenImportGuide] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

    // ✅ Hover/Active row highlight (NEW)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  /* ================= FETCH LEDGERS ================= */
  useEffect(() => {
    fetchStaffLedgers();
  }, []);

  const fetchStaffLedgers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ledgers`, {
        credentials: "include",
      });
      const json = await res.json();

      const filtered =
        json?.data?.filter(
          (l: Ledger) =>
            l.ledgerType?.name?.toLowerCase().includes("staff") ||
            l.ledgerType?.name?.toLowerCase().includes("supervisor")
        ) ?? [];

      setStaffLedgers(filtered);
    } catch {
      setStaffLedgers([]);
    }
  };

  /* ================= FETCH ENTRIES ================= */
  useEffect(() => {
    if (!selectedLedger?.id) {
      setEntries([]);
      return;
    }
    fetchEntries(selectedLedger.id);
  }, [selectedLedger]);

  const fetchEntries = async (staffLedgerId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/staff-expense?staffLedgerId=${staffLedgerId}`, {
        credentials: "include",
      });
      const json = await res.json();
      setEntries(json?.data ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STAFF NAME LIST ================= */
  const staffNameList = useMemo(() => staffLedgers.map((l) => l.name), [staffLedgers]);

  /* ================= RUNNING BALANCE ================= */
  const rowsWithBalance = useMemo(() => {
    let balance = 0;
    return [...entries]
      .sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime())
      .map((row) => {
        balance += (row.inAmount || 0) - (row.outAmount || 0);
        return { ...row, balance };
      });
  }, [entries]);

  /* ================= EXPORT DATA ================= */
  const exportData = useMemo(() => {
    return rowsWithBalance.map((r) => ({
      Date: new Date(r.expenseDate).toLocaleDateString(),
      Site: r.site?.siteName || "",
      Expense: r.expenseTitle,
      Summary: r.summary || "",
      Remark: r.remark || "",
      In: r.inAmount || "",
      Out: r.outAmount || "",
      Balance: r.balance,
    }));
  }, [rowsWithBalance]);

  /* ================= EXPORT DROPDOWN: OUTSIDE CLICK ================= */
  useEffect(() => {
    if (!showExport) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (exportWrapRef.current && !exportWrapRef.current.contains(target)) {
        setShowExport(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowExport(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showExport]);

  /* ================= IMPORT HANDLER (ONLY ADDITION) ================= */
  const runImport = async (file: File) => {
    if (!selectedLedger?.id) return;

    try {
      setImporting(true);

      toast({
        title: "⏳ Import started",
        description: "Please wait... entries are being imported",
      });

      const result = await importStaffLedgerExcel({
        file,
        staffLedgerId: selectedLedger.id,
        baseUrl: BASE_URL,
        onProgress: (done, total) => {
          // (optional) avoid too many toasts; keep silent
          // you can add a progress UI later if needed
        },
      });

      // refresh table after import
      await fetchEntries(selectedLedger.id);

      if (result.failCount === 0) {
        toast({
          title: "✅ Import completed",
          description: `${result.successCount} rows imported successfully`,
        });
      } else {
        toast({
          title: "⚠️ Import completed with errors",
          description: `Success: ${result.successCount}, Failed: ${result.failCount} (check console for error rows)`,
        });
        console.log("IMPORT ERRORS:", result.errors);
      }
    } catch (e: any) {
      toast({
        title: "❌ Import failed",
        description: e?.message || "Import failed",
      });
    } finally {
      setImporting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-4 md:p-6 border rounded-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Staff Ledger</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ===== Search + Buttons ===== */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search / Select Staff..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  const ledger = staffLedgers.find((l) => l.name === val);
                  setSelectedLedger(ledger || null);
                }}
                list="staff-options"
              />
              <datalist id="staff-options">
                {staffNameList.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-2 md:ml-auto flex-wrap">
              <Button
                disabled={!selectedLedger}
                onClick={() => {
                  setShowExport(false);
                  setOpenForm("exp");
                }}
              >
                Expense Entry
              </Button>

              <Button
                variant="outline"
                disabled={!selectedLedger}
                onClick={() => {
                  setShowExport(false);
                  setOpenForm("received");
                }}
              >
                Amount Received
              </Button>

              {/* ✅ IMPORT BUTTON (ONLY ADDITION) */}
              <Button
                variant="outline"
                disabled={!selectedLedger || importing}
                onClick={() => {
                  setShowExport(false);
                  setOpenImportGuide(true); // guideline first
                }}
              >
                {importing ? "Importing..." : "Import Excel"}
              </Button>

              {/* hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  // allow re-upload same file again
                  e.target.value = "";
                  if (!file) return;
                  await runImport(file);
                }}
              />

              {/* ✅ Export wrapper ref: dropdown closes on outside click */}
              <div ref={exportWrapRef} className="relative">
                <Button variant="outline" disabled={!selectedLedger} onClick={() => setShowExport(!showExport)}>
                  Export
                </Button>

                {showExport && selectedLedger && (
                  <div className="absolute right-0 top-12 w-44 bg-background border rounded-md shadow z-50">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToExcel(exportData, selectedLedger.name);
                        setShowExport(false);
                      }}
                    >
                      Export Excel
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToPDF(exportData, selectedLedger.name);
                        setShowExport(false);
                      }}
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== STAFF INFO ===== */}
          {selectedLedger && (
            <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted">
              <div>
                <p className="text-xs">Account Of</p>
                <p className="font-semibold">{selectedLedger.name}</p>
              </div>
              <div>
                <p className="text-xs">Address</p>
                <p>{selectedLedger.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs">Contact</p>
                <p>{selectedLedger.mobile || "—"}</p>
              </div>
            </div>
          )}

          {/* ===== TABLE ===== */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="w-full text-sm" style={{ minWidth: 1200 }}>
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Expense</th>
                  <th className="p-3">Summary</th>
                  <th className="p-3">Remark</th>
                  <th className="p-3 text-green-600">In</th>
                  <th className="p-3 text-red-500">Out</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                )}

                {rowsWithBalance.map((row) => {
                  const isHover = hoveredRowId === row.id;
                  const isActive = activeRowId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={() => setActiveRowId(row.id)}
                      aria-selected={isActive}
                      className={[
                        "border-t cursor-pointer transition-colors duration-150",
                        // ✅ default hover (even if not selected)
                        "hover:bg-primary/5",
                        // ✅ hovered row (slightly stronger than hover)
                        isHover ? "bg-primary/7" : "",
                        // ✅ selected row (strongest)
                        isActive ? "bg-primary/12" : "",
                      ].join(" ")}
                      style={{
                        // ✅ left bar highlight (hover + selected)
                        boxShadow: isActive
                          ? "inset 4px 0 0 hsl(var(--primary))"
                          : isHover
                          ? "inset 4px 0 0 hsl(var(--primary) / 0.55)"
                          : undefined,
                      }}
                    >
                      <td className="p-3">
                        {new Date(row.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">{row.site?.siteName || "—"}</td>
                      <td className="p-3">{row.expenseTitle}</td>
                      <td className="p-3">{row.summary || "—"}</td>
                      <td className="p-3">{row.remark || "—"}</td>
                      <td className="p-3 text-green-600">{row.inAmount ?? ""}</td>
                      <td className="p-3 text-red-500">{row.outAmount ?? ""}</td>
                      <td className="p-3 font-semibold">{row.balance}</td>

                      {/* ✅ prevent row click when clicking icons */}
                      <td className="p-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Pencil
                          className="h-4 w-4 cursor-pointer text-blue-500"
                          onClick={() => {
                            setActiveRowId(row.id); // ✅ keep row selected
                            setEditRow(row);
                          }}
                        />
                        <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                      </td>
                    </tr>
                  );
                })}


              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== IMPORT GUIDELINE POPUP (ONLY ADDITION) ===== */}
      <Dialog open={openImportGuide} onOpenChange={setOpenImportGuide}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Excel Import Guidelines</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm leading-6">
            <p className="font-medium">Excel file must have exactly these columns in first row (same order):</p>
            <div className="p-3 rounded-md border bg-muted/40 font-mono text-xs">
              Date | Site | Expense | Summary | Remark | In | Out
            </div>

            <ul className="list-disc pl-5 space-y-1">
              <li><b>Date</b> can be Excel Date or text (dd-mm-yyyy / dd/mm/yyyy).</li>
              <li><b>Site</b> must match site name exactly as in Sites master (or keep blank).</li>
              <li><b>Expense</b> is mandatory.</li>
              <li><b>In</b> OR <b>Out</b> — only one should be filled (both filled not allowed).</li>
              <li>Every row will create a new entry (this import does not edit old rows).</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpenImportGuide(false)} disabled={importing}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpenImportGuide(false);
                // open file picker
                setTimeout(() => fileRef.current?.click(), 0);
              }}
              disabled={importing || !selectedLedger}
            >
              OK, Select Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== POPUPS ===== */}
      <Dialog open={openForm === "exp"} onOpenChange={() => setOpenForm(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Expense Entry</DialogTitle>
          </DialogHeader>
          {selectedLedger && (
            <StaffExpEntryForm
              staffLedger={selectedLedger}
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openForm === "received"} onOpenChange={() => setOpenForm(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Amount Received</DialogTitle>
          </DialogHeader>
          {selectedLedger && (
            <StaffAmountReceive
              staffLedger={selectedLedger}
              onClose={() => {
                setOpenForm(null);
                fetchEntries(selectedLedger.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent className="max-w-xl">
          {editRow && (
            <EditStaffLedger
              row={editRow}
              onClose={() => setEditRow(null)}
              onUpdated={() => selectedLedger && fetchEntries(selectedLedger.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
