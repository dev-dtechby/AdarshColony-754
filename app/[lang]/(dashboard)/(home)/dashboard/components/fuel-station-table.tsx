"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { FuelStationRow } from "../dashboard.types";

type Props = {
  loading?: boolean;
  rows: FuelStationRow[];
};

const n = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
const inr = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const qty = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function FuelStationTable({ loading, rows }: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!rows?.length) {
    return <div className="p-6 text-sm text-default-500">No fuel station data found.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }} className="w-full">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Fuel Station</th>
            <th className="text-right p-3 font-semibold">Qty (L)</th>
            <th className="text-right p-3 font-semibold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.stationName}-${idx}`} className="border-b">
              <td className="p-3">{r.stationName || "-"}</td>
              <td className="p-3 text-right">{qty(r.qty)}</td>
              <td className="p-3 text-right">{inr(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
