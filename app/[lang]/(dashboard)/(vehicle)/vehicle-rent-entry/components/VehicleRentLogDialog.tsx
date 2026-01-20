"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Save } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { API } from "./vehicle-rent.api";
import type { Site, VehicleRentLog, VehicleRentVehicle } from "./vehicle-rent.types";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

export default function VehicleRentLogDialog({
  open,
  onClose,
  mode,
  sites,
  vehicles,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  mode: "CREATE" | "EDIT";
  sites: Site[];
  vehicles: VehicleRentVehicle[];
  initial?: Partial<VehicleRentLog>;
  onSaved?: () => void;
}) {
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId || "");
  const [siteId, setSiteId] = useState(initial?.siteId || "");
  const [entryDate, setEntryDate] = useState<Date | undefined>(initial?.entryDate ? new Date(initial.entryDate) : new Date());

  const [startMeter, setStartMeter] = useState(String(initial?.startMeter ?? ""));
  const [endMeter, setEndMeter] = useState(String(initial?.endMeter ?? ""));
  const [dieselExp, setDieselExp] = useState(String(initial?.dieselExp ?? ""));
  const [generatedAmt, setGeneratedAmt] = useState(String(initial?.generatedAmt ?? ""));
  const [paymentAmt, setPaymentAmt] = useState(String(initial?.paymentAmt ?? ""));
  const [remarks, setRemarks] = useState(String(initial?.remarks ?? ""));

  const workingHour = useMemo(() => Math.max(0, n(endMeter) - n(startMeter)), [startMeter, endMeter]);
  const balance = useMemo(() => n(generatedAmt) - n(paymentAmt), [generatedAmt, paymentAmt]);

  const canSave = useMemo(() => {
    if (!vehicleId || !siteId || !entryDate) return false;
    if (n(endMeter) < n(startMeter)) return false;
    if (n(generatedAmt) < 0 || n(paymentAmt) < 0) return false;
    return true;
  }, [vehicleId, siteId, entryDate, startMeter, endMeter, generatedAmt, paymentAmt]);

  const save = async () => {
    if (!canSave) return;
    try {
      const payload = {
        vehicleId,
        siteId,
        entryDate: entryDate?.toISOString(),
        startMeter: n(startMeter),
        endMeter: n(endMeter),
        dieselExp: n(dieselExp),
        generatedAmt: n(generatedAmt),
        paymentAmt: n(paymentAmt),
        remarks: remarks?.trim() || null,
      };

      const url = mode === "EDIT" ? `${API.logs}/${initial?.id}` : API.logs;
      const method = mode === "EDIT" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed");

      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Save failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle>{mode === "CREATE" ? "Add Logbook Entry" : "Edit Logbook Entry"}</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Vehicle</Label>
              <select className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNo} — {v.vehicleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Site</Label>
              <select className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Select site</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn("h-9 w-full flex items-center justify-between px-3 rounded-md border bg-background text-sm", !entryDate && "text-muted-foreground")}
                  >
                    {entryDate ? entryDate.toLocaleDateString() : "Select Date"}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 z-[9999]" align="start" side="bottom" sideOffset={8}>
                  <Calendar mode="single" selected={entryDate} onSelect={(d) => setEntryDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label>Start Meter</Label>
              <Input value={startMeter} onChange={(e) => setStartMeter(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>End Meter</Label>
              <Input value={endMeter} onChange={(e) => setEndMeter(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Working Hour (Auto)</Label>
              <Input value={workingHour ? workingHour.toFixed(2) : ""} readOnly tabIndex={-1} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Diesel Exp</Label>
              <Input value={dieselExp} onChange={(e) => setDieselExp(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Generated Amt</Label>
              <Input value={generatedAmt} onChange={(e) => setGeneratedAmt(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Payment</Label>
              <Input value={paymentAmt} onChange={(e) => setPaymentAmt(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Balance (Auto)</Label>
              <Input value={balance ? balance.toFixed(2) : ""} readOnly tabIndex={-1} />
            </div>

            <div className="space-y-1 md:col-span-4">
              <Label>Remarks</Label>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!canSave} className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>

          {n(endMeter) < n(startMeter) ? (
            <div className="text-xs text-red-500">End Meter reading start se chhota nahi ho sakta.</div>
          ) : null}
        </Card>
      </DialogContent>
    </Dialog>
  );
}
