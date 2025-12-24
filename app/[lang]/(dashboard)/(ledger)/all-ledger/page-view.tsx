"use client";

import LedgerListTable from "./components/LedgerListTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* PAGE TITLE */}
      <div className="text-2xl font-medium text-default-800">
        All Ledger List
      </div>

      {/* MAIN LEDGER TABLE */}
      <LedgerListTable />
    </div>
  );
}
