"use client";

import StaffLedgerTable from "./components/StaffLedgerTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-default-900">
        Staff Ledger
      </h2>

      <StaffLedgerTable />
    </div>
  );
}
