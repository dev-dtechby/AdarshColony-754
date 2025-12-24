"use client";

import SiteForm from "./components/SiteForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="text-2xl font-semibold text-default-900">
        Create New Site Entry
      </div>

      {/* Form Card */}
      <div className="p-0">
        <SiteForm />
      </div>

    </div>
  );
}
