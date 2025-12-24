"use client";

import PartyPurchaseForm from "./components/PartyPurchaseForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* PAGE TITLE */}
      {/* <div className="text-2xl font-medium text-default-800">
        Party Purchase Entry
      </div> */}

      {/* MAIN FORM CARD */}
      <div className="card p-6 rounded-xl border shadow-sm">
        <PartyPurchaseForm />
      </div>
    </div>
  );
}
