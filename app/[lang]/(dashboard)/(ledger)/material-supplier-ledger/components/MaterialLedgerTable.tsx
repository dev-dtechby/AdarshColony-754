"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Plus, Edit, Trash2 } from "lucide-react";

export default function MaterialLedgerTable() {
  const supplierList = ["Hemant Chopda", "Kanker Supplier", "Rasani Supplier"];
  const materialTypes = ["Sand", "Limestone", "Murum", "Other"];

  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [contact, setContact] = useState("");

  // Dummy Data
  const ledgerRows = [
    {
      date: "21-11-2025",
      site: "Dev Site",
      receipt: "RC-889",
      parchi: "parchi.jpg",
      otp: "4589",
      vehicleNo: "CG04-5521",
      vehiclePhoto: "pic1.jpg",
      material: "Sand",
      size: "Medium",
      qty: 12,
      rate: 550,
      amount: 6600,
      royaltyQty: 12,
      royaltyRate: 50,
      royaltyAmount: 600,
      gst: 18,
      taxAmt: 1296,
      grandTotal: 8496,
      payment: 8000,
      balance: 496,
    },
  ];

  return (
    <Card className="p-6 shadow-sm border rounded-xl">
      {/* ---------------- TOP HEADER ---------------- */}
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-default-900">
          Material Supplier Ledger
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ---------------- FILTER BAR ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Input
            placeholder="Search Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="border px-3 py-2 rounded-md bg-background text-sm"
          >
            <option value="">Select Account</option>
            {supplierList.map((v, i) => (
              <option key={i}>{v}</option>
            ))}
          </select>

          <Input
            placeholder="Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        </div>

        {/* ---------------- TOTAL CARDS ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900">
            <p className="text-sm">Total Received</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">
              ₹ 0
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900">
            <p className="text-sm">Total Pay</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-300">
              ₹ 0
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900">
            <p className="text-sm">Balance</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              ₹ 0
            </p>
          </div>
        </div>

        {/* ---------------- MATERIAL LIST SECTION ---------------- */}
        <div className="border rounded-lg p-4">
          <p className="font-semibold mb-2">Material List</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {materialTypes.map((m) => (
              <div
                key={m}
                className="flex gap-2 items-center border px-3 py-2 rounded-md"
              >
                <span className="font-medium w-20">{m}</span>
                <Input placeholder="Qty" className="w-20 h-7 text-xs" />
                <Input placeholder="Amt" className="w-20 h-7 text-xs" />
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- EXPORT BUTTON ---------------- */}
        <div className="flex justify-end">
          <Button variant="outline" className="flex gap-2">
            <Download className="h-4 w-4" /> Export Ledger
          </Button>
        </div>

        {/* ---------------- LEDGER TABLE ---------------- */}
        <ScrollArea className="w-full max-h-[65vh] rounded-md border overflow-auto">
          <div className="min-w-[1700px] whitespace-nowrap">
            <table className="w-full table-auto border-collapse text-sm">
              <thead className="bg-default-100 text-default-700 sticky top-0 z-20">
                <tr>
                  {[
                    "DATE",
                    "Site",
                    "Receipt No",
                    "Parchi Photo",
                    "OTP",
                    "Vehicle No",
                    "Vehicle Photo",
                    "Material",
                    "Size",
                    "Qty",
                    "Rate",
                    "Amt",
                    "Royalty Qty",
                    "Royalty Rate",
                    "Royalty Amt",
                    "GST",
                    "Tax Amt",
                    "Grand Total",
                    "Payment",
                    "Balance",
                    "Action",
                  ].map((head) => (
                    <th key={head} className="p-3 text-left">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-default-50">
                    <td className="p-3">{row.date}</td>
                    <td className="p-3">{row.site}</td>
                    <td className="p-3">{row.receipt}</td>
                    <td className="p-3 underline text-primary cursor-pointer">
                      {row.parchi}
                    </td>
                    <td className="p-3">{row.otp}</td>
                    <td className="p-3">{row.vehicleNo}</td>
                    <td className="p-3 underline text-primary cursor-pointer">
                      {row.vehiclePhoto}
                    </td>
                    <td className="p-3">{row.material}</td>
                    <td className="p-3">{row.size}</td>
                    <td className="p-3">{row.qty}</td>
                    <td className="p-3">₹ {row.rate}</td>
                    <td className="p-3">₹ {row.amount}</td>
                    <td className="p-3">{row.royaltyQty}</td>
                    <td className="p-3">₹ {row.royaltyRate}</td>
                    <td className="p-3">₹ {row.royaltyAmount}</td>
                    <td className="p-3">{row.gst}%</td>
                    <td className="p-3">₹ {row.taxAmt}</td>
                    <td className="p-3 font-semibold">₹ {row.grandTotal}</td>
                    <td className="p-3">{row.payment}</td>
                    <td className="p-3">{row.balance}</td>

                    <td className="p-3 flex gap-2">
                      <Button size="icon" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
