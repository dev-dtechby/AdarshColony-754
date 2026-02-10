"use client";

import RegistrationListTable from "../../components/RegistrationListTable";

interface Props {
  trans: any;
}

export default function DashboardPageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-2xl font-semibold text-default-900">
        Registered Members
      </div>

      {/* List Table */}
      <RegistrationListTable />
    </div>
  );
}
