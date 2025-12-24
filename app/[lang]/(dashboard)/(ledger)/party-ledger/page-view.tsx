"use client";

import PartyLedgerTable from "./components/PartyLedgerTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">

      {/* PAGE TITLE */}
      {/* <div className="text-2xl font-semibold text-default-800">
        Party Ledger
      </div> */}

      {/* MAIN LEDGER COMPONENT */}
      <div className="rounded-md">
        <PartyLedgerTable />
      </div>
    </div>
  );
}
