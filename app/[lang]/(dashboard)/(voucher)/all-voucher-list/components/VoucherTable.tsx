"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function VoucherTable() {
  const [search, setSearch] = useState("");

  // 🔹 Dummy Data (Replace with API later)
  const data = [
    {
      voucherDate: "05-12-2025",
      site: "New Raipur Site",
      department: "Civil",
      onAccount: "Material Supply",
      grossAmt: "₹ 1,20,000",
      withheld: "₹ 2,000",
      incomeTax: "₹ 8,000",
      revenue: "₹ 500",
      lwf: "₹ 200",
      royalty: "₹ 1,500",
      misc: "₹ 400",
      karmkarTax: "₹ 150",
      securedDeposit: "₹ 5,000",
      tdsOnGST: "₹ 700",
      tds: "₹ 2,400",
      performanceGuarantee: "₹ 3,000",
      gst: "₹ 18,000",
      improperFinishing: "₹ 600",
      otherDeduction: "₹ 1,200",
      deductionAmt: "₹ 23,250",
      chequeAmt: "₹ 96,750",
      voucher: "VCH/2025/001",
    },
  ];

  return (
    <Card className="p-6 border rounded-md mt-4">
      {/* <h2 className="text-xl font-semibold text-default-900 mb-4">
        All Voucher List
      </h2> */}

      {/* 🔍 Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="civil">Civil</SelectItem>
            <SelectItem value="mechanical">Mechanical</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE WRAPPER (Horizontal + Vertical Scroll) */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[65vh] border rounded-md">
        <table className="min-w-[1800px] border-collapse text-sm">
          <thead className="sticky top-0 bg-default-100 z-10">
            <tr className="text-default-700">
              {[
                "Voucher Date",
                "Site",
                "Department",
                "On Account",
                "Gross Amt",
                "Withheld",
                "Income Tax",
                "Revenue",
                "LWF",
                "Royalty",
                "Misc. Deduction",
                "Karmkar Tax",
                "Secured Deposit",
                "TDS on GST",
                "TDS",
                "Performance Guarantee",
                "GST",
                "Improper Finishing",
                "Other Deduction",
                "Deduction Amt",
                "Cheque Amt",
                "Voucher",
                "Action",
              ].map((head, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left whitespace-nowrap border-b"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className="border-b hover:bg-default-50 transition"
              >
                <td className="px-4 py-3">{item.voucherDate}</td>
                <td className="px-4 py-3">{item.site}</td>
                <td className="px-4 py-3">{item.department}</td>
                <td className="px-4 py-3">{item.onAccount}</td>
                <td className="px-4 py-3 font-semibold">{item.grossAmt}</td>
                <td className="px-4 py-3">{item.withheld}</td>
                <td className="px-4 py-3">{item.incomeTax}</td>
                <td className="px-4 py-3">{item.revenue}</td>
                <td className="px-4 py-3">{item.lwf}</td>
                <td className="px-4 py-3">{item.royalty}</td>
                <td className="px-4 py-3">{item.misc}</td>
                <td className="px-4 py-3">{item.karmkarTax}</td>
                <td className="px-4 py-3">{item.securedDeposit}</td>
                <td className="px-4 py-3">{item.tdsOnGST}</td>
                <td className="px-4 py-3">{item.tds}</td>
                <td className="px-4 py-3">{item.performanceGuarantee}</td>
                <td className="px-4 py-3">{item.gst}</td>
                <td className="px-4 py-3">{item.improperFinishing}</td>
                <td className="px-4 py-3">{item.otherDeduction}</td>
                <td className="px-4 py-3 font-semibold text-red-600">
                  {item.deductionAmt}
                </td>
                <td className="px-4 py-3 font-semibold text-green-600">
                  {item.chequeAmt}
                </td>
                <td className="px-4 py-3">{item.voucher}</td>

                {/* ACTION ICONS */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary cursor-pointer hover:scale-110 transition" />
                    <Pencil className="w-5 h-5 text-yellow-600 cursor-pointer hover:scale-110 transition" />
                    <Trash2 className="w-5 h-5 text-red-600 cursor-pointer hover:scale-110 transition" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
