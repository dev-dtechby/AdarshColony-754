"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const toDateInput = (d: any) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function EditPaymentDialog({
  open,
  onClose,
  apiBase,
  sites,
  paymentRow,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  sites: any[];
  paymentRow: any | null;
  onSaved?: () => void;
}) {
  const paymentId = useMemo(() => String(paymentRow?.id || ""), [paymentRow]);

  const [paymentDate, setPaymentDate] = useState("");
  const [siteId, setSiteId] = useState("");
  const [mode, setMode] = useState("CASH");
  const [refNo, setRefNo] = useState("");
  const [through, setThrough] = useState("");
  const [amount, setAmount] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setPaymentDate(toDateInput(paymentRow?.paymentDate));
    setSiteId(String(paymentRow?.siteId || paymentRow?.site?.id || ""));
    setMode(String(paymentRow?.mode || "CASH"));
    setRefNo(String(paymentRow?.refNo || ""));
    setThrough(String(paymentRow?.through || ""));
    setAmount(String(paymentRow?.amount ?? ""));
  }, [open, paymentRow]);

  const canSave = useMemo(() => {
    if (!paymentId) return false;
    if (!paymentDate) return false;
    if (!siteId) return false;
    if (n(amount) <= 0) return false;
    return true;
  }, [paymentId, paymentDate, siteId, amount]);

  const save = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiBase}/payments/${paymentId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDate,
          siteId,
          mode,
          refNo: refNo.trim() || null,
          through: through.trim() || null,
          amount: n(amount),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Update failed");

      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Site</Label>
              <select className="border bg-background px-3 py-2 rounded-md text-sm w-full"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="">Select Site</option>
                {sites.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.siteName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Mode</Label>
              <select className="border bg-background px-3 py-2 rounded-md text-sm w-full"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="CASH">CASH</option>
                <option value="BANK">BANK</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1">
              <Label>Ref No (optional)</Label>
              <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Through (optional)</Label>
              <Input value={through} onChange={(e) => setThrough(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!canSave || saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
