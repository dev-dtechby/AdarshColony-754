"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { CostBreakdownRow } from "../dashboard.types";

type Props = {
  loading?: boolean;
  rows: CostBreakdownRow[];
};

const n = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
const inr = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function CostBreakdownChart({ loading, rows }: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!rows?.length) {
    return <div className="p-6 text-sm text-default-500">No data found.</div>;
  }

  const total = rows.reduce((s, r) => s + n(r.amount), 0);

  return (
    <div className="p-2">
      <div style={{ overflowX: "auto" }} className="w-full">
        <table className="min-w-[360px] w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Head</th>
              <th className="text-right p-3 font-semibold">Amount (₹)</th>
              <th className="text-right p-3 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const share = total > 0 ? (n(r.amount) / total) * 100 : 0;
              return (
                <tr key={`${r.label}-${idx}`} className="border-b">
                  <td className="p-3">{r.label}</td>
                  <td className="p-3 text-right">{inr(r.amount)}</td>
                  <td className="p-3 text-right">{share.toFixed(2)}%</td>
                </tr>
              );
            })}
            <tr>
              <td className="p-3 font-semibold">Total</td>
              <td className="p-3 text-right font-semibold">{inr(total)}</td>
              <td className="p-3 text-right font-semibold">100.00%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
