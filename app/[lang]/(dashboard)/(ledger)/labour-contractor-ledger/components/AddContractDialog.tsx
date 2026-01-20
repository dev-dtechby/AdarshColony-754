"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Site } from "./labour-ledger.types";

export default function AddContractDialog({
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
  const [agreedAmount, setAgreedAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [agreement, setAgreement] = useState<File | null>(null);

  const reset = () => {
    setSiteId("");
    setAgreedAmount("");
    setRemarks("");
    setAgreement(null);
  };

  // dialog close/open sync: open true होते ही fresh state (optional)
  useEffect(() => {
    if (open) {
      // keep as-is (अगर आप चाहो तो reset() भी कर सकते हो)
    }
  }, [open]);

  const save = async () => {
    if (!contractorId) return;

    if (!siteId) return alert("Site required");

    const amt = Number(String(agreedAmount ?? "").trim());
    if (!Number.isFinite(amt) || amt < 0) return alert("Agreed amount invalid");

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("contractorId", contractorId);
      fd.append("siteId", siteId);
      fd.append("agreedAmount", String(amt));

      const rmk = String(remarks ?? "").trim();
      if (rmk) fd.append("remarks", rmk);

      if (agreement) fd.append("agreement", agreement);

      const res = await fetch(`${apiBase}/contracts`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Create deal failed");

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
            Add Site Deal — {contractorName || "Contractor"}
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
            placeholder="Agreed Amount (Deal Amount)"
            value={agreedAmount}
            onChange={(e) => setAgreedAmount(e.target.value)}
            inputMode="decimal"
            disabled={saving}
          />

          <Input
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={saving}
          />

          <div className="text-xs text-muted-foreground">
            Agreement file (optional)
          </div>

          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setAgreement(e.target.files?.[0] || null)}
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
            {saving ? "Saving..." : "Save Deal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
