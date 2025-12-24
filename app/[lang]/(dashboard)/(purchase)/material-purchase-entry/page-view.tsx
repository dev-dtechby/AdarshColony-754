"use client";

import MaterialForm from "./components/MaterialForm";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      
      {/* PAGE TITLE */}
      {/* <div className="text-2xl font-medium text-default-800">
        Material Purchase Entry
      </div> */}

      {/* MAIN FORM CARD */}
      <MaterialForm />

    </div>
  );
}
