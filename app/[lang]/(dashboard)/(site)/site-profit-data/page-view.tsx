"use client";

import SiteProfitChart from "./components/SiteProfitChart";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Heading */}
      {/* <h1 className="text-2xl font-semibold text-default-900">
        Site Profit & Loss
      </h1> */}

      {/* Main Card Section */}
      <div className="card p-6 rounded-md border shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-default-800">
          All Site Profit & Loss Details
        </h3>

        <SiteProfitChart />
      </div>
    </div>
  );
}
