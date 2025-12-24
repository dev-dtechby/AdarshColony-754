"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MaterialLedgerTable from "./components/MaterialLedgerTable";

interface Props {
  trans: any;
}

export default function PageView({ trans }: Props) {
  return (
    <div className="space-y-6">
      {/* PAGE TITLE */}
      {/* <div className="text-2xl font-semibold text-default-900">
        Material Purchase Entry
      </div> */}

      {/* MAIN CARD WRAPPER */}
      {/* <Card className="p-6 rounded-xl shadow-sm border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Material Purchase Ledger
          </CardTitle>
        </CardHeader>

        <CardContent>
          Material Ledger Table Component
          <MaterialLedgerTable />
        </CardContent>
      </Card> */}
      
      <CardContent>
          {/* Material Ledger Table Component */}
          <MaterialLedgerTable />
        </CardContent>
    </div>
  );
}
