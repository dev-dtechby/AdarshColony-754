"use client";

import RegistrationForm from "../../components/RegistrationForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-2xl font-semibold text-default-900">
        New Registration
      </div>

      {/* Form */}
      <div className="p-0">
        <RegistrationForm />
      </div>
    </div>
  );
}
