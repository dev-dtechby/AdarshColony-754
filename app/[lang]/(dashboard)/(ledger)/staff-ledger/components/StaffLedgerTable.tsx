"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";
import EditStaffLedger from "./EditStaffLedger";
import { StaffExpense } from "./types";
import {
  exportStaffLedgerToExcel,
  exportStaffLedgerToPDF,
} from "./StaffLedgerExp";

/* ================= TYPES ================= */
interface Ledger {
  id: string;
  name: string;
  address?: string | null;
  mobile?: string | null;
  ledgerType?: { name: string } | null;
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function StaffLedgerTable() {
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] =
    useState<"exp" | "received" | null>(null);

  const [staffLedgers, setStaffLedgers] = useState<Ledger[]>([]);
  const [selectedLedger, setSelectedLedger] =
    useState<Ledger | null>(null);

  const [entries, setEntries] = useState<StaffExpense[]>([]);
  const [loading, setLoading] = useState(false);

  const [editRow, setEditRow] =
    useState<StaffExpense | null>(null);

  const [showExport, setShowExport] = useState(false);

  // ✅ Export dropdown close on outside click
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

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
            l.ledgerType?.name
              ?.toLowerCase()
              .includes("staff") ||
            l.ledgerType?.name
              ?.toLowerCase()
              .includes("supervisor")
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
      const res = await fetch(
        `${BASE_URL}/api/staff-expense?staffLedgerId=${staffLedgerId}`,
        { credentials: "include" }
      );
      const json = await res.json();
      setEntries(json?.data ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STAFF NAME LIST ================= */
  const staffNameList = useMemo(
    () => staffLedgers.map((l) => l.name),
    [staffLedgers]
  );

  /* ================= RUNNING BALANCE ================= */
  const rowsWithBalance = useMemo(() => {
    let balance = 0;
    return [...entries]
      .sort(
        (a, b) =>
          new Date(a.expenseDate).getTime() -
          new Date(b.expenseDate).getTime()
      )
      .map((row) => {
        balance +=
          (row.inAmount || 0) - (row.outAmount || 0);
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

      // If click is outside export wrapper => close dropdown
      if (
        exportWrapRef.current &&
        !exportWrapRef.current.contains(target)
      ) {
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

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-4 md:p-6 border rounded-xl bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">
            Staff Ledger
          </CardTitle>
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
                  const ledger = staffLedgers.find(
                    (l) => l.name === val
                  );
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

              {/* ✅ Export wrapper ref: dropdown closes on outside click */}
              <div ref={exportWrapRef} className="relative">
                <Button
                  variant="outline"
                  disabled={!selectedLedger}
                  onClick={() => setShowExport(!showExport)}
                >
                  Export
                </Button>

                {showExport && selectedLedger && (
                  <div className="absolute right-0 top-12 w-44 bg-background border rounded-md shadow z-50">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToExcel(
                          exportData,
                          selectedLedger.name
                        );
                        setShowExport(false); // ✅ close after action
                      }}
                    >
                      Export Excel
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                      onClick={() => {
                        exportStaffLedgerToPDF(
                          exportData,
                          selectedLedger.name
                        );
                        setShowExport(false); // ✅ close after action
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
                <p className="font-semibold">
                  {selectedLedger.name}
                </p>
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
            <table
              className="w-full text-sm"
              style={{ minWidth: 1200 }}
            >
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

                {rowsWithBalance.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-muted/50"
                  >
                    <td className="p-3">
                      {new Date(row.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {row.site?.siteName || "—"}
                    </td>
                    <td className="p-3">{row.expenseTitle}</td>
                    <td className="p-3">{row.summary || "—"}</td>
                    <td className="p-3">{row.remark || "—"}</td>
                    <td className="p-3 text-green-600">
                      {row.inAmount ?? ""}
                    </td>
                    <td className="p-3 text-red-500">
                      {row.outAmount ?? ""}
                    </td>
                    <td className="p-3 font-semibold">
                      {row.balance}
                    </td>
                    <td className="p-3 flex gap-2">
                      <Pencil
                        className="h-4 w-4 cursor-pointer text-blue-500"
                        onClick={() => setEditRow(row)}
                      />
                      <Trash2 className="h-4 w-4 cursor-pointer text-red-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== POPUPS ===== */}
      <Dialog
        open={openForm === "exp"}
        onOpenChange={() => setOpenForm(null)}
      >
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

      <Dialog
        open={openForm === "received"}
        onOpenChange={() => setOpenForm(null)}
      >
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
              onUpdated={() =>
                selectedLedger && fetchEntries(selectedLedger.id)
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
