import type { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">All Member List</h1>
        <p className="text-sm opacity-70">
          Block-wise / Name-wise member listing with search & excel import.
        </p>
      </div>

      {children}
    </div>
  );
}