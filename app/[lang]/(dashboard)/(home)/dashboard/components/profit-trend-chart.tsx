"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProfitTrendRow } from "../dashboard.types";

type Props = {
  loading?: boolean;
  rows: ProfitTrendRow[];
};

const n = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
const inr = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function ProfitTrendChart({ loading, rows }: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!rows?.length) {
    return <div className="p-6 text-sm text-default-500">No data found.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }} className="w-full">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-right p-3 font-semibold">Inflow (₹)</th>
            <th className="text-right p-3 font-semibold">Outflow (₹)</th>
            <th className="text-right p-3 font-semibold">Profit (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.date}-${idx}`} className="border-b">
              <td className="p-3">{r.date}</td>
              <td className="p-3 text-right">{inr(r.inflow)}</td>
              <td className="p-3 text-right">{inr(r.outflow)}</td>
              <td className="p-3 text-right">{inr(r.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
