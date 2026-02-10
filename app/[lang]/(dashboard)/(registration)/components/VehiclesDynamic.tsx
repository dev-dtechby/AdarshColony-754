"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export type VehicleRow = {
  vehicleNo: string;
  type: string;
};

interface VehicleProps {
  title: string;
  subtitle: string;
  value: VehicleRow[];
  onChange: (next: VehicleRow[]) => void;
  max?: number; // default 5
  typePlaceholder?: string;
}

function VehicleTable({
  title,
  subtitle,
  value,
  onChange,
  max = 5,
  typePlaceholder = "Type",
}: VehicleProps) {
  const rows = value?.length ? value : [{ vehicleNo: "", type: "" }];

  const addRow = () => {
    if (rows.length >= max) return;
    onChange([...rows, { vehicleNo: "", type: "" }]);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<VehicleRow>) => {
    const next = [...rows];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={rows.length >= max}
          className="gap-2"
        >
          <Plus size={16} />
          Add Row
        </Button>
      </div>

      {/* Table-like */}
      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid grid-cols-[80px_1fr_1fr_120px] bg-muted/40 px-4 py-2 text-sm font-medium">
          <div>S.No</div>
          <div>Vehicle No.</div>
          <div>Type</div>
          <div className="text-right">Action</div>
        </div>

        <div className="divide-y">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_120px] gap-3 px-4 py-3"
            >
              <div className="text-sm font-medium md:pt-2">
                {String(idx + 1).padStart(2, "0")}
              </div>

              <div className="space-y-1">
                <Label className="md:hidden">Vehicle No.</Label>
                <Input
                  value={r.vehicleNo}
                  onChange={(e) => updateRow(idx, { vehicleNo: e.target.value })}
                  placeholder="Ex: CG04AB1234"
                />
              </div>

              <div className="space-y-1">
                <Label className="md:hidden">Type</Label>
                <Input
                  value={r.type}
                  onChange={(e) => updateRow(idx, { type: e.target.value })}
                  placeholder={typePlaceholder}
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

      <div className="text-xs text-muted-foreground">
        Max {max} rows. कम से कम 1 row रहेगी.
      </div>
    </div>
  );
}

interface Props {
  twoWheelers: VehicleRow[];
  setTwoWheelers: (next: VehicleRow[]) => void;
  fourWheelers: VehicleRow[];
  setFourWheelers: (next: VehicleRow[]) => void;
}

export default function VehiclesDynamic({
  twoWheelers,
  setTwoWheelers,
  fourWheelers,
  setFourWheelers,
}: Props) {
  return (
    <div className="space-y-8">
      <VehicleTable
        title="Two Wheeler Details"
        subtitle="Bike / Scooty (Add rows as needed)"
        value={twoWheelers}
        onChange={setTwoWheelers}
        max={5}
        typePlaceholder="Bike / Scooty"
      />

      <VehicleTable
        title="Four Wheeler Details"
        subtitle="Car / Auto / E-Auto / Tempo / Other (Add rows as needed)"
        value={fourWheelers}
        onChange={setFourWheelers}
        max={5}
        typePlaceholder="Car/Auto/E-Auto/Tempo/Other"
      />
    </div>
  );
}
