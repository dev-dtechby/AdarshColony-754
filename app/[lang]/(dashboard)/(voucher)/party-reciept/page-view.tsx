"use client";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-2xl font-medium text-default-800">
        Reciept Entry
      </div>

      <div className="card p-6 rounded-md border">
        <h3 className="text-lg font-semibold">Reciept Entry</h3>
        <p className="text-default-500">Form Coming Soon...</p>
      </div>
    </div>
  );
}
