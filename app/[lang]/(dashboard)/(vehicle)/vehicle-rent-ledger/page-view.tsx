// D:\Projects\branao.in\clone\branao-Full-Kit\app\[lang]\(dashboard)\(vehicle)\vehicle-rent-ledger\page-view.tsx
"use client";

import VehicleRentLedgerTable from "./components/VehicleRentLedgerTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  // baseUrl prop kept for compatibility with your table signature
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

  return (
    <div className="space-y-6">
      {/* <div className="text-2xl font-medium text-default-800">
        Vehicle Rent Ledger
      </div> */}

      <VehicleRentLedgerTable baseUrl={baseUrl} />
    </div>
  );
}
