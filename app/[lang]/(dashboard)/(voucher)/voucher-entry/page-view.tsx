"use client";

import VoucherForm from "./components/VoucherForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      {/* <div className="text-2xl font-medium text-default-800">
        Voucher Entry
      </div> */}

      {/* Voucher Form */}
      <div className="card p-6 rounded-md border shadow-sm">
        <VoucherForm />
      </div>
    </div>
  );
}
