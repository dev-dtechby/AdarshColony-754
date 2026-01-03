"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import SiteSummaryCards from "../../site-summary/components/SiteSummaryCards";
import AddExp from "./AddExp";
import EditExp from "./EditExp";

/* ========= SHADCN ========= */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ========= EXPORT ========= */
import {
  exportSiteExpenseToExcel,
  exportSiteExpenseToPDF,
} from "./siteExpExportUtils";

import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Expense {
  id: string;
  site: { siteName: string };
  expenseDate: string;
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: number;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

export default function SiteExp() {
  const [viewMode, setViewMode] = useState<"exp" | "summary">("exp");
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [openAddExp, setOpenAddExp] = useState(false);

  const [sites, setSites] = useState<Site[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEditExp, setSelectedEditExp] = useState<any>(null);

  /* 🔥 DELETE STATES (ONLY ADDITION) */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    // ✅ cache bust + no-store
    fetch(`${SITE_API}?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j) => setSites(j.data || []))
      .catch(() => setSites([]));
  }, []);

  /* ================= LOAD EXPENSES ================= */
  const loadExpenses = async () => {
    try {
      // ✅ cache bust + no-store (important)
      const res = await fetch(`${EXP_API}?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      setExpenses(json.data || []);
    } catch {
      setExpenses([]);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  /* ✅ IMPORTANT FIX:
     If you edit staff-ledger in another page and come back here,
     Next.js may keep state. So refresh on focus/visibility. */
  useEffect(() => {
    const refreshIfExpMode = () => {
      if (viewMode === "exp") loadExpenses();
    };

    const onFocus = () => refreshIfExpMode();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshIfExpMode();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [viewMode]); // viewMode change respected

  /* ================= FILTER + GLOBAL SEARCH ================= */
  const filtered = expenses.filter((v) => {
    const q = search.toLowerCase();

    const matchSearch =
      v.expenseTitle?.toLowerCase().includes(q) ||
      v.summary?.toLowerCase().includes(q) ||
      v.paymentDetails?.toLowerCase().includes(q) ||
      v.site?.siteName?.toLowerCase().includes(q) ||
      String(v.amount).includes(q) ||
      new Date(v.expenseDate)
        .toLocaleDateString()
        .toLowerCase()
        .includes(q);

    const matchSite = selectedSite
      ? v.site?.siteName === selectedSite
      : true;

    return matchSearch && matchSite;
  });

  /* ================= TOTAL ================= */
  const totalAmount = filtered.reduce(
    (sum, v) => sum + Number(v.amount || 0),
    0
  );

  /* ================= EXPORT ================= */
  const exportData = [
    ...filtered.map((row) => ({
      Site: row.site?.siteName || "N/A",
      Date: new Date(row.expenseDate).toLocaleDateString(),
      Expense: row.expenseTitle,
      Summary: row.summary,
      Payment: row.paymentDetails,
      Amount: row.amount,
    })),
    ...(filtered.length
      ? [
          {
            Site: selectedSite || "All Sites",
            Date: "",
            Expense: "",
            Summary: "TOTAL",
            Payment: "",
            Amount: totalAmount,
          },
        ]
      : []),
  ];

  /* ================= SOFT DELETE (ONLY NEW LOGIC) ================= */
  const confirmDelete = async () => {
    if (!selectedExp) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`${EXP_API}/${selectedExp.id}`, {
        method: "DELETE", // ✅ SOFT DELETE
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      setDeleteOpen(false);
      setSelectedExp(null);
      loadExpenses();
    } catch {
      alert("❌ Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 border rounded-xl shadow-sm">
        <CardHeader className="space-y-4">
          {/* MODE */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={viewMode === "exp"}
                onChange={() => setViewMode("exp")}
              />
              <span className="font-medium">Site Expense Details</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={viewMode === "summary"}
                onChange={() => setViewMode("summary")}
              />
              <span className="font-medium">Summary Wise Expense</span>
            </label>
          </div>

          {/* FILTER BAR */}
          {viewMode === "exp" && (
            <div className="flex flex-wrap gap-3 justify-end">
              <Input
                placeholder="Global Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-56"
              />

              <select
                className="border bg-background px-3 py-2 rounded-md text-sm md:w-44"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Select Site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.siteName}>
                    {s.siteName}
                  </option>
                ))}
              </select>

              <Button onClick={() => setOpenAddExp(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Expense Entry
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      exportSiteExpenseToExcel(exportData, "site-expenses")
                    }
                  >
                    Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportSiteExpenseToPDF(exportData, "site-expenses")
                    }
                  >
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardHeader>

        {/* ================= TABLE ================= */}
        {viewMode === "exp" && (
          <CardContent className="p-0">
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "1200px" }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 sticky top-0 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Expenses</th>
                      <th className="px-3 py-2 text-left">Exp. Summary</th>
                      <th className="px-3 py-2 text-left">Payment</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t hover:bg-primary/10 transition"
                      >
                        <td className="px-3 py-2">
                          {new Date(row.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {row.expenseTitle}
                        </td>
                        <td className="px-3 py-2">{row.summary}</td>
                        <td className="px-3 py-2">{row.paymentDetails}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ₹ {row.amount}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedEditExp(row);
                                setOpenEdit(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedExp(row);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filtered.length > 0 && (
                      <tr className="font-semibold bg-muted/40 border-t">
                        <td className="px-3 py-2">Total</td>
                        <td colSpan={3}></td>
                        <td className="px-3 py-2 text-right">₹ {totalAmount}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        )}

        {viewMode === "summary" && <SiteSummaryCards />}
      </Card>

      {/* 🔥 DELETE CONFIRM DIALOG (ONLY ADDITION) */}
      <DeleteConfirmDialog
        open={deleteOpen}
        title="Delete Expense?"
        description="This expense entry will be moved to Deleted Records. You can restore it later."
        loading={deleteLoading}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedExp(null);
        }}
        onConfirm={confirmDelete}
      />

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Site Expense</DialogTitle>
          </DialogHeader>

          {selectedEditExp && (
            <EditExp
              expense={{
                id: selectedEditExp.id,
                siteId: selectedEditExp.site?.id || "",
                expenseDate: selectedEditExp.expenseDate,
                expenseTitle: selectedEditExp.expenseTitle,
                expenseSummary: selectedEditExp.summary,
                paymentDetails: selectedEditExp.paymentDetails,
                amount: selectedEditExp.amount,
              }}
              onClose={() => setOpenEdit(false)}
              onSaved={loadExpenses}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ADD EXP MODAL */}
      <Dialog open={openAddExp} onOpenChange={setOpenAddExp}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Site Expense</DialogTitle>
          </DialogHeader>
          <AddExp onClose={() => setOpenAddExp(false)} onSaved={loadExpenses} />
        </DialogContent>
      </Dialog>
    </>
  );
}
