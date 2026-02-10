"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DatePickerWithRange from "@/components/date-picker-with-range";
import DashboardSelect from "@/components/dasboard-select"; // aap site select bhi isi style me bana sakte ho

// === You will create these components (similar to your analytics components) ===
import BranaoKpiStrip from "./components/branao-kpi-strip";
import ProfitTrendChart from "./components/profit-trend-chart";
import CostBreakdownChart from "./components/cost-breakdown-chart";
import VehicleDieselTable from "./components/vehicle-diesel-table";
import FuelStationTable from "./components/fuel-station-table";
import ContractorTable from "./components/contractor-table";
import RecentTransactionsTable from "./components/recent-transactions-table";

type Props = { trans: { [key: string]: string } };

export default function BranaoDashboardPageView({ trans }: Props) {
  const [siteId, setSiteId] = useState<string>("");
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (siteId) p.set("siteId", siteId);
    if (range.from) p.set("from", range.from);
    if (range.to) p.set("to", range.to);
    return p.toString();
  }, [siteId, range]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/site-summary?${query}`, { cache: "no-store" });
        const json = await res.json();
        setData(json?.data ?? json);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Header (same pattern) */}
      <div className="flex items-center flex-wrap justify-between gap-4">
        <div className="text-2xl font-medium text-default-800">
          Adarsh Colony 754 {trans?.dashboard}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Site selector */}
          <DashboardSelect /* you can adapt this to select site */ />
          {/* Date range */}
          <DatePickerWithRange /* onChange should setRange */ />
        </div>
      </div>

      {/* KPI Strip */}
      <BranaoKpiStrip loading={loading} kpis={data?.kpis} />

      {/* Trend + Breakdown */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle className="pt-2.5">Profit Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ProfitTrendChart loading={loading} rows={data?.profitTrend ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle className="pt-2.5">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart loading={loading} rows={data?.costBreakdown ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicle Diesel Summary */}
      <Card>
        <CardHeader className="border-none pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 text-xl font-semibold text-default-900 whitespace-nowrap">
              Vehicle-wise Diesel Summary
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <VehicleDieselTable loading={loading} rows={data?.vehicleFuelSummary ?? []} />
        </CardContent>
      </Card>

      {/* Fuel station + Contractors */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle className="pt-2.5">Fuel Station Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <FuelStationTable loading={loading} rows={data?.fuelStationSummary ?? []} />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader className="border-none pb-0">
              <CardTitle className="pt-2.5">Labour / Vehicle Rent Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ContractorTable loading={loading} rows={data?.contractorSummary ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="border-none pb-0">
          <CardTitle className="pt-2.5">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <RecentTransactionsTable loading={loading} rows={data?.recent ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
