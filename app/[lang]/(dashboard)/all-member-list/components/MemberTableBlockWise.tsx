"use client";

import { Card } from "@/components/ui/card";
import { Member, SortMode } from "./types";

export default function MemberTableBlockWise({
  grouped,
  sort,
}: {
  grouped: Array<[number, Member[]]>;
  sort: SortMode;
}) {
  return (
    <div className="space-y-4">
      {grouped.map(([blk, members]) => (
        <Card key={blk} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Block {blk}</div>
            <div className="text-sm opacity-70">Total: {members.length}</div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-sm" style={{ minWidth: 980 }}>
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Reg No</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Father/Husband</th>
                  <th className="text-left p-2">Mobile</th>
                  <th className="text-left p-2">Floor</th>
                  <th className="text-left p-2">Flat</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{m.memberCode}</td>
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                    <td className="p-2">{m.mobileNo ?? "-"}</td>
                    <td className="p-2">{m.floor ?? "-"}</td>
                    <td className="p-2">{m.flatNo}</td>
                  </tr>
                ))}
                {!members.length && (
                  <tr>
                    <td className="p-4 text-center opacity-70" colSpan={7}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-xs opacity-60">
            Sort mode: <b>{sort}</b>
          </div>
        </Card>
      ))}

      {!grouped.length && <Card className="p-6 text-center opacity-70">No members found</Card>}
    </div>
  );
}