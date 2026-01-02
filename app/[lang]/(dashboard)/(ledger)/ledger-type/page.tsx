"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LedgerTypePage() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");

  const fetchData = async () => {
    const res = await fetch("/api/ledger-types");
    const json = await res.json();
    setList(json.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const save = async () => {
    if (!name) return;

    await fetch("/api/ledger-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    fetchData();
  };

  const remove = async (id: string) => {
    await fetch(`/api/ledger-types/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Ledger Type Master</h2>

      <div className="flex gap-2">
        <Input
          placeholder="Ledger Type Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={save}>Add</Button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 600 }} className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-right p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2">{row.name}</td>
                <td className="p-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove(row.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
