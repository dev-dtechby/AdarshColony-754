"use client";

import SiteSummaryCards from "./components/SiteSummaryCards";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-2xl font-medium text-default-800">
        Site Summary
      </div>

      {/* Summary Card Component */}
      <div className="card p-6 rounded-md border shadow-sm">
        <SiteSummaryCards />
      </div>
    </div>
  );
}
