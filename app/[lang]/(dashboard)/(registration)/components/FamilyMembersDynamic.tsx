"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type FamilyMember = { name: string };

interface Props {
  value: FamilyMember[];
  onChange: (next: FamilyMember[]) => void;
  max?: number; // default 5
}

export default function FamilyMembersDynamic({ value, onChange, max = 5 }: Props) {
  const rows = value?.length ? value : [{ name: "" }];

  const addRow = () => {
    if (rows.length >= max) return;
    onChange([...rows, { name: "" }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return; // keep at least 1
    onChange(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, name: string) => {
    const next = [...rows];
    next[idx] = { name };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Family Members</div>
          <div className="text-xs text-muted-foreground">
            Add/remove rows (max {max})
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={rows.length >= max}
          className="gap-2"
        >
          <Plus size={16} />
          Add Member
        </Button>
      </div>

      {/* Table-like layout (Branao purchase style) */}
      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid grid-cols-[80px_1fr_120px] bg-muted/40 px-4 py-2 text-sm font-medium">
          <div>S.No</div>
          <div>Full Name</div>
          <div className="text-right">Action</div>
        </div>

        <div className="divide-y">
          {rows.map((m, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[80px_1fr_120px] gap-3 px-4 py-3"
            >
              <div className="text-sm font-medium md:pt-2">
                {String(idx + 1).padStart(2, "0")}
              </div>

              <div className="space-y-1">
                <Label className="md:hidden">Full Name</Label>
                <Input
                  value={m.name}
                  onChange={(e) => updateRow(idx, e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="flex md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeRow(idx)}
                  disabled={rows.length <= 1}
                  className="gap-2"
                >
                  <Trash2 size={16} />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="text-xs text-muted-foreground">
        Tip: कम से कम 1 row रहेगी; आप extra rows remove कर सकते हैं.
      </div>
    </div>
  );
}
