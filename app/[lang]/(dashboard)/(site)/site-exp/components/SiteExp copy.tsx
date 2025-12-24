"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Download, Edit, Trash2 } from "lucide-react";

export default function SiteExp() {
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

  // 🔹 Dummy Site List (Later DB se aayega)
  const siteList = ["Dev Site", "Kondagaon Site", "Rasani Site"];

  // 🔹 Dummy Expense Data
  const expData = [
    {
      site: "Dev Site",
      date: "21-11-2025",
      expense: "₹ 450",
      summary: "Petrol",
      payment: "UPI / Cash",
      amount: 450,
    },
    {
      site: "Dev Site",
      date: "19-11-2025",
      expense: "₹ 800",
      summary: "Transport",
      payment: "Cash",
      amount: 800,
    },
  ];

  // 🔍 Filter by Search + Site
  const filtered = expData.filter((v) => {
    const matchSearch = v.summary.toLowerCase().includes(search.toLowerCase());
    const matchSite = selectedSite ? v.site === selectedSite : true;
    return matchSearch && matchSite;
  });

  // 💰 Total Amount
  const totalAmount = filtered.reduce((sum, v) => sum + v.amount, 0);

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-3 items-center">
          <CardTitle className="text-xl font-semibold text-default-900">
            Site Expense Details
          </CardTitle>

          {/* 🔍 Search + Site Dropdown + Add + Export */}
          <div className="flex items-center gap-3 w-full md:w-auto">

            {/* Search */}
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56"
            />

            {/* Select Site Dropdown */}
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm md:w-44"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">Select Site</option>
              {siteList.map((site, i) => (
                <option key={i} value={site}>
                  {site}
                </option>
              ))}
            </select>

            {/* Add Expense Entry Button */}
            <Button className="flex items-center gap-2 bg-primary text-white">
              <Plus className="h-4 w-4" />
              Add Expense Entry
            </Button>

            {/* Export Button */}
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Responsive Scrollable Table */}
        <ScrollArea className="w-full overflow-auto rounded-md border">
          <table className="min-w-[1100px] w-full table-auto border-collapse">
            
            {/* --------- TABLE HEADER --------- */}
            <thead className="bg-default-100 text-default-700">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Expenses</th>
                <th className="p-3 text-left">Exp. Summary</th>
                <th className="p-3 text-left">Payment Details</th>
                <th className="p-3 text-left">Amt.</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            {/* --------- TABLE BODY --------- */}
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-default-50 transition text-default-700"
                >
                  <td className="p-3">{row.date}</td>
                  <td className="p-3">{row.expense}</td>
                  <td className="p-3">{row.summary}</td>
                  <td className="p-3">{row.payment}</td>
                  <td className="p-3 font-semibold text-default-900">
                    ₹ {row.amount.toLocaleString()}
                  </td>

                  <td className="p-3 flex gap-2">
                    <Button size="icon" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {/* No Data */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-default-500">
                    No Expense Records Found.
                  </td>
                </tr>
              )}

              {/* --------- TOTAL ROW --------- */}
              {filtered.length > 0 && (
                <tr className="bg-default-200 border-t font-semibold">
                  <td className="p-3">Total</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="p-3 text-default-900">
                    ₹ {totalAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>

          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
