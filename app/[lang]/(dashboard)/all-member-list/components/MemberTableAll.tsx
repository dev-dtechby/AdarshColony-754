"use client";

import { Card } from "@/components/ui/card";
import { Member } from "./types";

export default function MemberTableAll({ rows }: { rows: Member[] }) {
  return (
    <Card className="p-4">
      <div style={{ overflowX: "auto" }}>
        <table className="w-full text-sm" style={{ minWidth: 1100 }}>
          <thead className="sticky top-0 bg-background">
            <tr className="border-b">
              <th className="text-left p-2">S.No</th>
              <th className="text-left p-2">Reg No</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Father/Husband</th>
              <th className="text-left p-2">Mobile</th>
              <th className="text-left p-2">Block</th>
              <th className="text-left p-2">Floor</th>
              <th className="text-left p-2">Flat</th>
              <th className="text-left p-2">Tenant Name</th>
              <th className="text-left p-2">Tenant Mobile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, idx) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{m.memberCode}</td>
                <td className="p-2 font-medium">{m.name}</td>
                <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                <td className="p-2">{m.mobileNo ?? "-"}</td>
                <td className="p-2">{m.blockNo}</td>
                <td className="p-2">{m.floor ?? "-"}</td>
                <td className="p-2">{m.flatNo}</td>
                <td className="p-2">{(m as any).rentalName ?? "-"}</td>
                <td className="p-2">{(m as any).rentalMobileNo ?? "-"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-6 text-center opacity-70" colSpan={8}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}