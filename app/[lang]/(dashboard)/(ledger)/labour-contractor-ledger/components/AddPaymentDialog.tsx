"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Site, LabourPaymentMode } from "./labour-ledger.types";

const todayYmd = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function AddPaymentDialog({
  open,
  onClose,
  apiBase,
  sites,
  contractorId,
  contractorName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  sites: Site[];
  contractorId: string;
  contractorName: string;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);

  const [siteId, setSiteId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayYmd);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<LabourPaymentMode>("CASH");
  const [refNo, setRefNo] = useState("");
  const [through, setThrough] = useState("");
  const [remarks, setRemarks] = useState("");

  const reset = () => {
    setSiteId("");
    setPaymentDate(todayYmd());
    setAmount("");
    setMode("CASH");
    setRefNo("");
    setThrough("");
    setRemarks("");
  };

  const save = async () => {
    if (!contractorId) return;
    if (!siteId) return alert("Site required");

    const amt = Number(String(amount ?? "").trim());
    if (!Number.isFinite(amt) || amt <= 0) return alert("Amount invalid");

    const pDate = String(paymentDate ?? "").trim();
    if (!pDate) return alert("Date required");

    try {
      setSaving(true);

      const res = await fetch(`${apiBase}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contractorId: String(contractorId).trim(),
          siteId: String(siteId).trim(),
          paymentDate: pDate,
          amount: amt,
          mode,
          refNo: String(refNo ?? "").trim() || undefined,
          through: String(through ?? "").trim() || undefined,
          remarks: String(remarks ?? "").trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Payment failed");

      await onSaved?.();
      reset();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Add Payment — {contractorName || "Contractor"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <select
            className="border bg-background px-3 py-2 rounded-md text-sm w-full"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            disabled={saving}
          >
            <option value="">Select Site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            disabled={saving}
          />

          <Input
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            disabled={saving}
          />

          <select
            className="border bg-background px-3 py-2 rounded-md text-sm w-full"
            value={mode}
            onChange={(e) => setMode(e.target.value as LabourPaymentMode)}
            disabled={saving}
          >
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
            <option value="UPI">UPI</option>
            <option value="CHEQUE">CHEQUE</option>
            <option value="OTHER">OTHER</option>
          </select>

          <Input
            placeholder="Ref No (UTR/Cheque)"
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Through (Bank/Person)"
            value={through}
            onChange={(e) => setThrough(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
