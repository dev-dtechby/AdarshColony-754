"use client";

import FuelLedgerTable from "./components/FuelLedgerTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* PAGE TITLE */}
      {/* <div className="text-2xl font-medium text-default-800">
        Fuel Station Ledger
      </div> */}

      {/* MAIN LEDGER TABLE */}
      <FuelLedgerTable />
    </div>
  );
}
