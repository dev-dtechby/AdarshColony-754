"use client";

import FuelPurchaseForm from "./components/FuelPurchaseForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      <div className="card p-6 rounded-md border shadow-sm">
        {/* ✅ FIX: FuelPurchaseForm only accepts onCancel */}
        <FuelPurchaseForm onCancel={() => {}} />
      </div>
    </div>
  );
}
