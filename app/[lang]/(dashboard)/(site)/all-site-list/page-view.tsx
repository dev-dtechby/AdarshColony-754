"use client";

import SiteListTable from "./components/SiteListTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">

      {/* Page Heading */}
      <div className="text-2xl font-semibold text-default-900">
        All Site List
      </div>

      {/* Main Table Component */}
      <SiteListTable />

    </div>
  );
}
