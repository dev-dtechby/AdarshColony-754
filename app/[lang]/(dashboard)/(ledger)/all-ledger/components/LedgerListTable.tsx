"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LedgerListTable() {
  const [search, setSearch] = useState("");

  const data = [
    {
      site: "New Raipur Site",
      ledgerType: "Material Supplier",
      partyName: "Shyam Steel Traders",
      balance: "₹ 40,000",
    },
    {
      site: "Kawardha Road Site",
      ledgerType: "Labour Contractor",
      partyName: "Hari Labour Group",
      balance: "₹ 1,20,000",
    },
  ];

  return (
    <Card className="p-6 border rounded-md mt-4">
      <h2 className="text-xl font-semibold text-default-900 mb-4">
        Party Ledger List
      </h2>

      {/* 🔍 Search + Select Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="raipur">New Raipur Site</SelectItem>
            <SelectItem value="kawardha">Kawardha Road Site</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex justify-end lg:justify-start">
          <Button className="w-full lg:w-auto">Export</Button>
        </div>
      </div>

      {/* TABLE WRAPPER for Mobile Scroll */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-default-100 text-default-700">
              <th className="px-4 py-3 text-left whitespace-nowrap">Site</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Ledger Type</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Party Name</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Balance</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-t hover:bg-default-50">
                <td className="px-4 py-3">{item.site}</td>
                <td className="px-4 py-3">{item.ledgerType}</td>
                <td className="px-4 py-3">{item.partyName}</td>
                <td className="px-4 py-3 font-semibold">{item.balance}</td>

                {/* ACTION ICONS */}
                <td className="px-4 py-3 flex items-center justify-center gap-3">
                  <Eye className="w-5 h-5 text-primary cursor-pointer hover:scale-110 transition" />
                  <Pencil className="w-5 h-5 text-yellow-500 cursor-pointer hover:scale-110 transition" />
                  <Trash2 className="w-5 h-5 text-red-500 cursor-pointer hover:scale-110 transition" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
