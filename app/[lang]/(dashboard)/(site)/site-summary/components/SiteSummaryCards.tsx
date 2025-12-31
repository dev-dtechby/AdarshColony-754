"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";

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
  summary: string;
  amount: number;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

export default function SiteSummaryCards() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

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
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const res = await fetch(EXP_API);
        const json = await res.json();
        setExpenses(json.data || []);
      } catch {
        setExpenses([]);
      }
    };
    loadExpenses();
  }, []);

  /* ================= SUMMARY GROUPING ================= */
  const summaryRows = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((exp) => {
      if (selectedSite && exp.site?.siteName !== selectedSite) return;

      const key = exp.summary || "Other";
      map.set(key, (map.get(key) || 0) + Number(exp.amount || 0));
    });

    return Array.from(map.entries()).map(([summary, amount]) => ({
      summary,
      amount,
    }));
  }, [expenses, selectedSite]);

  /* ================= GLOBAL SEARCH ================= */
  const filtered = summaryRows.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.summary.toLowerCase().includes(q) ||
      String(v.amount).includes(q)
    );
  });

  /* ================= TOTAL ================= */
  const totalAmount = filtered.reduce((sum, v) => sum + v.amount, 0);

  /* ================= EXPORT DATA (WITH SITE + TOTAL) ================= */
  const exportData = [
    ...filtered.map((row) => ({
      Site: selectedSite || "All Sites",
      "Expense Summary": row.summary,
      Amount: row.amount,
    })),

    ...(filtered.length > 0
      ? [
          {
            Site: selectedSite || "All Sites",
            "Expense Summary": "TOTAL",
            Amount: totalAmount,
          },
        ]
      : []),
  ];

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      {/* ================= HEADER ================= */}
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <CardTitle className="text-xl font-semibold">
            Summary Wise Expenses
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  exportToCSV(exportData, "summary-wise-expenses")
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  exportToExcel(exportData, "summary-wise-expenses")
                }
              >
                Excel
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  exportToPDF(exportData, "summary-wise-expenses")
                }
              >
                PDF
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* ================= TABLE ================= */}
      <CardContent>
        <div className="border rounded-md">
          <ScrollArea className="h-[320px] w-full">
            <div className="w-max min-w-full overflow-x-auto">
              <table className="table-fixed w-max min-w-full">
                <thead className="bg-muted/40 sticky top-0 z-10">
                  <tr>
                    <th className="min-w-[300px] px-4 py-2 text-left whitespace-nowrap">
                      Exp. Summary
                    </th>
                    <th className="min-w-[180px] px-4 py-2 text-right whitespace-nowrap">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-muted/20"
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-medium">
                        {row.summary}
                      </td>

                      <td className="px-4 py-2 text-right font-semibold whitespace-nowrap">
                        ₹ {row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-4">
                        No Records Found
                      </td>
                    </tr>
                  )}

                  {filtered.length > 0 && (
                    <tr className="font-semibold border-t bg-muted/30">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">
                        ₹ {totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
