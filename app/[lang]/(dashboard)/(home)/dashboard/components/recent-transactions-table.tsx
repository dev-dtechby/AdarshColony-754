"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { RecentTxnRow } from "../dashboard.types";

type Props = {
  loading?: boolean;
  rows: RecentTxnRow[];
};

const n = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
const inr = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function RecentTransactionsTable({ loading, rows }: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!rows?.length) {
    return <div className="p-6 text-sm text-default-500">No recent transactions found.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }} className="w-full">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Source</th>
            <th className="text-left p-3 font-semibold">Ref</th>
            <th className="text-left p-3 font-semibold">Party</th>
            <th className="text-right p-3 font-semibold">Amount (₹)</th>
            <th className="text-left p-3 font-semibold">Remark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.date}-${idx}`} className="border-b">
              <td className="p-3 whitespace-nowrap">{r.date}</td>
              <td className="p-3">{r.source}</td>
              <td className="p-3">{r.refNo || "-"}</td>
              <td className="p-3">{r.party || "-"}</td>
              <td className="p-3 text-right">{inr(r.amount)}</td>
              <td className="p-3">{r.remark || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
