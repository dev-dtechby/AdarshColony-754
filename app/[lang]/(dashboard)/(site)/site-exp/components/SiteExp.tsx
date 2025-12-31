"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import SiteSummaryCards from "../../site-summary/components/SiteSummaryCards";
import AddExp from "./AddExp";

/* ========= SHADCN UI ========= */
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

/* ========= EXPORT UTILS ========= */
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from "@/lib/exportUtils";

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

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await fetch(SITE_API);
        const json = await res.json();
        setSites(json.data || []);
      } catch {
        setSites([]);
      }
    };
    loadSites();
  }, []);

  /* ================= LOAD EXPENSES ================= */
  const loadExpenses = async () => {
    try {
      const res = await fetch(EXP_API);
      const json = await res.json();
      setExpenses(json.data || []);
    } catch {
      setExpenses([]);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

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

  /* ================= EXPORT DATA (WITH SITE + TOTAL) ================= */
  const exportData = [
    ...filtered.map((row) => ({
      Site: row.site?.siteName || "N/A",
      Date: new Date(row.expenseDate).toLocaleDateString(),
      Expense: row.expenseTitle,
      Summary: row.summary,
      Payment: row.paymentDetails,
      Amount: row.amount,
    })),

    ...(filtered.length > 0
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

  return (
    <>
      <Card className="p-6 shadow-sm border rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* RADIO BUTTONS */}
            <div className="flex gap-6 items-center">
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
              <div className="flex flex-col md:flex-row gap-3 items-center md:justify-end w-full">
                <Input
                  placeholder="Search..."
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
                  {sites.map((site) => (
                    <option key={site.id} value={site.siteName}>
                      {site.siteName}
                    </option>
                  ))}
                </select>

                <Button
                  className="flex items-center gap-2 bg-primary text-white"
                  onClick={() => setOpenAddExp(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Expense Entry
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        exportToCSV(exportData, "site-expenses")
                      }
                    >
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        exportToExcel(exportData, "site-expenses")
                      }
                    >
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        exportToPDF(exportData, "site-expenses")
                      }
                    >
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        {/* ================= TABLE ================= */}
        {viewMode === "exp" && (
          <CardContent>
            <div className="border rounded-md">
              <ScrollArea className="h-[360px] w-full">
                <div className="w-max min-w-full overflow-x-auto">
                  <table className="table-fixed w-max min-w-full">
                    <thead className="bg-muted/40 sticky top-0 z-10">
                      <tr>
                        <th className="min-w-[120px] px-3 py-2">Date</th>
                        <th className="min-w-[220px] px-3 py-2">Expenses</th>
                        <th className="min-w-[220px] px-3 py-2">
                          Exp. Summary
                        </th>
                        <th className="min-w-[220px] px-3 py-2">
                          Payment Details
                        </th>
                        <th className="min-w-[120px] px-3 py-2 text-right">
                          Amt.
                        </th>
                        <th className="min-w-[100px] px-3 py-2 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t hover:bg-muted/20"
                        >
                          <td className="px-3 py-2">
                            {new Date(
                              row.expenseDate
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            {row.expenseTitle}
                          </td>
                          <td className="px-3 py-2">{row.summary}</td>
                          <td className="px-3 py-2">
                            {row.paymentDetails}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ₹ {row.amount}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center gap-2">
                              <Button size="icon" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="soft">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            No Expense Records Found.
                          </td>
                        </tr>
                      )}

                      {filtered.length > 0 && (
                        <tr className="font-semibold border-t bg-muted/30">
                          <td className="px-3 py-2">Total</td>
                          <td colSpan={3}></td>
                          <td className="px-3 py-2 text-right">
                            ₹ {totalAmount}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        )}

        {viewMode === "summary" && (
          <div className="mt-4">
            <SiteSummaryCards />
          </div>
        )}
      </Card>

      {/* ================= ADD EXPENSE POPUP ================= */}
      <Dialog open={openAddExp} onOpenChange={setOpenAddExp}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Site Expense</DialogTitle>
          </DialogHeader>

          <AddExp
            onClose={() => setOpenAddExp(false)}
            onSaved={loadExpenses}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
