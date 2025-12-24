"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Wallet, MoreHorizontal } from "lucide-react";

// Status colors
const statusColors: any = {
  Ongoing: "bg-blue-500/20 text-blue-500",
  Completed: "bg-green-500/20 text-green-500",
  "Not Started": "bg-gray-400/20 text-gray-400",
  "On Hold": "bg-yellow-500/20 text-yellow-600",
};

export default function SiteProfitChart() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [openMenu, setOpenMenu] = useState<number | null>(null); // for 3-dots menu

  // 🔹 Data (Later DB se aayega)
  const [siteProfitData, setSiteProfitData] = useState([
    {
      department: "PWD",
      siteName: "Dev Site",
      expenses: 35000,
      amountReceived: 55000,
      status: "On Hold",
    },
    {
      department: "RWD",
      siteName: "Kondagaon Site",
      expenses: 42000,
      amountReceived: 39000,
      status: "Not Started",
    },
  ]);

  const departmentList = ["All", ...new Set(siteProfitData.map((v) => v.department))];

  // 🔍 Filter logic
  const filteredData = siteProfitData.filter((row) => {
    const deptMatch = department === "All" || row.department === department;
    const searchMatch =
      row.siteName.toLowerCase().includes(search.toLowerCase()) ||
      row.department.toLowerCase().includes(search.toLowerCase());
    return deptMatch && searchMatch;
  });

  // 🔹 Totals
  const totalExp = filteredData.reduce((sum, v) => sum + v.expenses, 0);
  const totalReceive = filteredData.reduce((sum, v) => sum + v.amountReceived, 0);
  const totalProfit = totalReceive - totalExp;

  // Update Status
  const updateStatus = (index: number, newStatus: string) => {
    const updated = [...siteProfitData];
    updated[index].status = newStatus;
    setSiteProfitData(updated);
    setOpenMenu(null);
  };

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle className="text-xl font-semibold text-default-900">
            All Site Profit List
          </CardTitle>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search Site / Department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-64"
            />

            <select
              className="border rounded-md px-3 py-2 bg-background text-sm md:w-40"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departmentList.map((dept) => (
                <option key={dept}>{dept}</option>
              ))}
            </select>

            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* ---------------- Table ---------------- */}
      <CardContent>
        <ScrollArea className="w-full overflow-auto rounded-md border">
          <table className="min-w-[1100px] w-full table-auto border-collapse">
            <thead className="bg-default-100 text-default-700">
              <tr>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Site Name</th>
                <th className="p-3 text-left">Expenses</th>
                <th className="p-3 text-left">Amt Received</th>
                <th className="p-3 text-left">Profit</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Summary</th>
                <th className="p-3 text-left">Exp Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((row, i) => {
                const profit = row.amountReceived - row.expenses;
                const rowIndex = siteProfitData.findIndex(
                  (item) => item.siteName === row.siteName
                );

                return (
                  <tr key={i} className="border-t">
                    <td className="p-3">{row.department}</td>
                    <td className="p-3">{row.siteName}</td>

                    <td className="p-3 text-red-500 font-semibold">
                      ₹ {row.expenses.toLocaleString()}
                    </td>

                    <td className="p-3 text-green-500 font-semibold">
                      ₹ {row.amountReceived.toLocaleString()}
                    </td>

                    <td
                      className={`p-3 font-bold ${
                        profit >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      ₹ {profit.toLocaleString()}
                    </td>

                    {/* ---------------- STATUS & 3 DOTS MENU ---------------- */}
                    <td className="p-3 relative">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            setOpenMenu(openMenu === rowIndex ? null : rowIndex)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        <span
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            statusColors[row.status]
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>

                      {openMenu === rowIndex && (
                        <div className="absolute mt-2 z-20 bg-default-100 border rounded-md shadow-md w-36 p-2 space-y-1">
                          {["Ongoing", "Completed", "Not Started", "On Hold"].map(
                            (status) => (
                              <div
                                key={status}
                                className={`px-2 py-1 text-sm rounded cursor-pointer hover:bg-default-200 ${
                                  statusColors[status]
                                }`}
                                onClick={() => updateStatus(rowIndex, status)}
                              >
                                {status}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </td>

                    {/* Summary */}
                    <td className="p-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => alert("Summary of " + row.siteName)}
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                      </Button>
                    </td>

                    {/* Exp Details */}
                    <td className="p-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => alert("Expense Details of " + row.siteName)}
                      >
                        <Wallet className="h-4 w-4 text-purple-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {/* Footer Totals */}
              <tr className="bg-default-200 font-semibold border-t">
                <td className="p-3">Total</td>
                <td></td>
                <td className="p-3 text-red-600">
                  ₹ {totalExp.toLocaleString()}
                </td>
                <td className="p-3 text-green-600">
                  ₹ {totalReceive.toLocaleString()}
                </td>
                <td
                  className={`p-3 font-bold ${
                    totalProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹ {totalProfit.toLocaleString()}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
