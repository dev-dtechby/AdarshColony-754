"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import StaffExpEntryForm from "./StaffExpEntryForm";
import StaffAmountReceive from "./StaffAmountReceive";

export default function StaffLedgerTable() {
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [openForm, setOpenForm] = useState<"exp" | "received" | null>(null);

  const staffList = [
    "Dev Site Exp",
    "All Site Exp",
    "Kondagaon Exp",
    "Rasani Site Exp",
  ];

  const allLedgerData = [
    {
      staff: "Dev Site Exp",
      date: "01-11-24",
      site: "Dev Site Exp",
      summary: "Petrol",
      through: "Kartik",
      out: 450,
      in: 0,
      balance: 0,
    },
    {
      staff: "All Site Exp",
      date: "27-10-25",
      site: "All Site Exp",
      summary: "Chaay",
      through: "Office",
      out: 60,
      in: 450,
      balance: 260,
    },
  ];

  const filteredData = selectedStaff
    ? allLedgerData.filter((row) => row.staff === selectedStaff)
    : [];

  const toggleForm = (type: "exp" | "received") => {
    setOpenForm((prev) => (prev === type ? null : type));
  };

  return (
    <>
      {/* ================= MAIN LEDGER CARD ================= */}
      <Card className="p-4 md:p-6 shadow-sm border rounded-xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-default-900">
            Staff Ledger
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* -------- Search + Buttons -------- */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center">

            {/* Staff Search Input */}
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search / Select Staff..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedStaff(e.target.value);
                }}
                list="staff-options"
                className="h-10"
              />

              <datalist id="staff-options">
                {staffList.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            {/* Top Buttons */}
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button
                className="px-4 md:px-6"
                onClick={() => toggleForm("exp")}
                disabled={!selectedStaff}
                variant={openForm === "exp" ? "default" : "outline"}
              >
                Expense Entry
              </Button>

              <Button
                className="px-4 md:px-6"
                onClick={() => toggleForm("received")}
                disabled={!selectedStaff}
                variant={openForm === "received" ? "default" : "outline"}
              >
                Amount Received
              </Button>

              <Button className="px-4 md:px-6">Export</Button>
            </div>
          </div>

          {/* -------- Staff Info Box -------- */}
          {selectedStaff && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground">Account Of</p>
                <p className="font-semibold text-default-900">{selectedStaff}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-default-700">—</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Contact No</p>
                <p className="font-medium text-default-700">9340309474</p>
              </div>
            </div>
          )}

          {/* -------- Ledger Table -------- */}
          <ScrollArea className="rounded-md border w-full overflow-auto">
            <table className="min-w-[900px] w-full table-auto">
              <thead className="bg-default-100 text-default-700">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Site</th>
                  <th className="p-3 text-left">Summary</th>
                  <th className="p-3 text-left">Through</th>
                  <th className="p-3 text-left text-red-500">Out</th>
                  <th className="p-3 text-left text-green-500">In</th>
                  <th className="p-3 text-left">Balance</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-default-50 transition"
                  >
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.site}</td>
                    <td className="p-3">{row.summary}</td>
                    <td className="p-3">{row.through}</td>

                    <td className="p-3 text-red-500 font-semibold">₹ {row.out}</td>
                    <td className="p-3 text-green-500 font-semibold">₹ {row.in}</td>
                    <td className="p-3">₹ {row.balance}</td>

                    <td className="p-3 flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </td>
                  </tr>
                ))}

                {filteredData.length === 0 && selectedStaff && (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-muted-foreground">
                      No ledger records found for this staff.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ================= DYNAMIC FORMS ================= */}
      <div className="mt-4">
        {openForm === "exp" && (
          <StaffExpEntryForm
            staff={selectedStaff}
            onClose={() => setOpenForm(null)}
          />
        )}

        {openForm === "received" && (
          <StaffAmountReceive
            staff={selectedStaff}
            onClose={() => setOpenForm(null)}
          />
        )}
      </div>
    </>
  );
}
