"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BranaoKpis } from "../dashboard.types";

type Props = {
  loading?: boolean;
  kpis?: Partial<BranaoKpis> | null;
};

const n = (v: any) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));
const inr = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const qty = (v: any) => n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const KpiCard = ({
  title,
  value,
  sub,
  loading,
}: {
  title: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="border-none pb-2">
        <CardTitle className="text-sm font-medium text-default-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-default-900">{value}</div>
            {sub ? <div className="text-xs text-default-500">{sub}</div> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function BranaoKpiStrip({ loading, kpis }: Props) {
  const inflow = n(kpis?.inflow);
  const outflow = n(kpis?.outflow);
  const profit = n(kpis?.profit);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Inflow" value={`₹ ${inr(inflow)}`} sub="Total receipts / credits" loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Outflow" value={`₹ ${inr(outflow)}`} sub="Total expenses / debits" loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Net Profit / Loss" value={`₹ ${inr(profit)}`} sub={profit >= 0 ? "Profit" : "Loss"} loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Diesel Amount" value={`₹ ${inr(kpis?.dieselAmount)}`} sub={`Qty: ${qty(kpis?.dieselQty)} L`} loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Vehicle Rent" value={`₹ ${inr(kpis?.vehicleRentAmount)}`} sub="Site-wise rent" loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Labour" value={`₹ ${inr(kpis?.labourAmount)}`} sub="Contractor labour" loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Total Staff" value={`${n(kpis?.staffCount).toLocaleString("en-IN")}`} sub="All staff ledgers" loading={loading} />
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <KpiCard title="Total Supervisors" value={`${n(kpis?.supervisorCount).toLocaleString("en-IN")}`} sub="All supervisor ledgers" loading={loading} />
      </div>
    </div>
  );
}
