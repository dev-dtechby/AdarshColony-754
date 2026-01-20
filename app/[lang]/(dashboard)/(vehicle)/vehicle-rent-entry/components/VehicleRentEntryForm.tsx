"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, RefreshCcw } from "lucide-react";
import { API, normalizeList } from "./vehicle-rent.api";
import type { Ledger, VehicleRentBasis, VehicleRentVehicle } from "./vehicle-rent.types";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

export default function VehicleRentEntryForm({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [ownerLedgerId, setOwnerLedgerId] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [rentBasis, setRentBasis] = useState<VehicleRentBasis>("HOURLY");
  const [hourlyRate, setHourlyRate] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    if (!ownerLedgerId || !vehicleNo.trim() || !vehicleName.trim()) return false;
    if (rentBasis === "HOURLY" && n(hourlyRate) <= 0) return false;
    if (rentBasis === "MONTHLY" && n(monthlyRate) <= 0) return false;
    return true;
  }, [ownerLedgerId, vehicleNo, vehicleName, rentBasis, hourlyRate, monthlyRate]);

  const loadLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const res = await fetch(`${API.ledgers}?_ts=${Date.now()}`, { cache: "no-store", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      const list = normalizeList(json) as Ledger[];

      // Best-effort filter for vehicle owners (optional)
      const filtered = list.filter((l) => {
        const t = String(l?.ledgerType?.name || "").toLowerCase();
        const nm = String(l?.name || "").toLowerCase();
        return t.includes("vehicle") || t.includes("transport") || nm.includes("vehicle") || nm.includes("transport");
      });

      const finalList = (filtered.length ? filtered : list).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setLedgers(finalList);
    } finally {
      setLoadingLedgers(false);
    }
  };

  useEffect(() => {
    if (open) loadLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setOwnerLedgerId("");
    setVehicleNo("");
    setVehicleName("");
    setRentBasis("HOURLY");
    setHourlyRate("");
    setMonthlyRate("");
  };

  const save = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      // ✅ IMPORTANT: null mat bhejo. Undefined keys JSON.stringify me omit ho jati hain.
      const body: any = {
        ownerLedgerId,
        vehicleNo: vehicleNo.trim(),
        vehicleName: vehicleName.trim(),
        rentBasis,
      };

      if (rentBasis === "HOURLY") body.hourlyRate = n(hourlyRate);
      if (rentBasis === "MONTHLY") body.monthlyRate = n(monthlyRate);

      const res = await fetch(API.vehicles, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Create failed");

      onCreated?.();
      reset();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create Rented Vehicle</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Owner / Party (Ledger)</Label>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={ownerLedgerId}
                onChange={(e) => setOwnerLedgerId(e.target.value)}
              >
                <option value="">{loadingLedgers ? "Loading..." : "Select Owner Ledger"}</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Rent Basis</Label>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={rentBasis}
                onChange={(e) => setRentBasis(e.target.value as VehicleRentBasis)}
              >
                <option value="HOURLY">Hourly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Vehicle No</Label>
              <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="CG 04 AB 1234" />
            </div>

            <div className="space-y-1">
              <Label>Vehicle Name</Label>
              <Input value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} placeholder="JCB / Dumper / Truck" />
            </div>

            {rentBasis === "HOURLY" ? (
              <div className="space-y-1">
                <Label>Hourly Rate</Label>
                <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} inputMode="decimal" placeholder="e.g. 900" />
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Monthly Rate</Label>
                <Input value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} inputMode="decimal" placeholder="e.g. 45000" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={loadLedgers} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Refresh Ledgers
            </Button>
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave || saving} className="gap-2">
              <Plus className="h-4 w-4" /> {saving ? "Saving..." : "Create"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Agreement upload vehicle create ke baad “Ledger screen” me per-vehicle upload button se hoga.
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
