"use client";

import LedgerForm from "./components/LedgerForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">

      {/* ---------- Page Title ---------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-default-900">
          {trans?.create_new_ledger || "Create New Ledger"}
        </h2>
      </div>

      {/* ---------- Ledger Card ---------- */}
      <div className="card border rounded-md p-6 space-y-6 shadow-sm bg-card">

        {/* Section Heading */}
        <h3 className="text-lg font-semibold text-default-900">
          Ledger Details
        </h3>

        {/* The Actual Ledger Form Component */}
        <LedgerForm />

      </div>
    </div>
  );
}
