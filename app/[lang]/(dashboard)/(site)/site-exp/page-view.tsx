"use client";

import SiteExp from "./components/SiteExp";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* ---- Page Title ---- */}
      {/* <div className="text-2xl font-medium text-default-800">
        Site Expenses
      </div> */}

      {/* ---- Main UI Section ---- */}
      <div className="card p-6 rounded-md border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">All Site Expense Details</h3>

        {/* Load Site Expense Component */}
        <SiteExp />
      </div>
    </div>
  );
}
