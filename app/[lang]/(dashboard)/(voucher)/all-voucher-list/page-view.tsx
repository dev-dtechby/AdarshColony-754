"use client";

import VoucherTable from "./components/VoucherTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">

      {/* 🔹 Page Heading */}
      <div className="text-2xl font-medium text-default-800">
        {trans?.voucherListTitle || "Voucher List"}
      </div>

      <VoucherTable />

      {/* 🔹 Voucher Table Component */}
      {/* <div className="card p-6 rounded-md border">
        <h3 className="text-lg font-semibold mb-4">
          {trans?.voucherListSubTitle || "All Voucher List"}
        </h3>

        <VoucherTable />
      </div> */}
    </div>
  );
}
