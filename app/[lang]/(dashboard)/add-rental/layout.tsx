import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add Rental</h1>
      {children}
    </div>
  );
}