"use client";

import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

export default function EditContractDialog({
  open,
  onClose,
  apiBase,
  contractRow,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  contractRow: any | null;
  onSaved?: () => void;
}) {
  const contractId = useMemo(() => String(contractRow?.contractId || ""), [contractRow]);

  const [agreedAmount, setAgreedAmount] = useState("");
  const [agreementUrl, setAgreementUrl] = useState("");
  const [agreementName, setAgreementName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAgreedAmount(String(contractRow?.agreedAmount ?? ""));
    setAgreementUrl(String(contractRow?.agreementUrl ?? ""));
    setAgreementName(String(contractRow?.agreementName ?? ""));
  }, [open, contractRow]);

  const canSave = useMemo(() => {
    if (!contractId) return false;
    if (n(agreedAmount) <= 0) return false;
    return true;
  }, [contractId, agreedAmount]);

  const save = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      const res = await fetch(`${apiBase}/contracts/${contractId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreedAmount: n(agreedAmount),
          agreementUrl: agreementUrl.trim() || null,
          agreementName: agreementName.trim() || null,
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
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Contract (Deal)</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Site: </span>
            <span className="font-medium">{contractRow?.siteName || "-"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Agreed Amount</Label>
              <Input value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-1">
              <Label>Agreement Name (optional)</Label>
              <Input value={agreementName} onChange={(e) => setAgreementName(e.target.value)} placeholder="Agreement.pdf" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Agreement URL (optional)</Label>
              <Input value={agreementUrl} onChange={(e) => setAgreementUrl(e.target.value)} placeholder="https://..." />
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
