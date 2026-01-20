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

export default function AddContractorDialog({
  open,
  onClose,
  apiBase,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const reset = () => {
    setName("");
    setMobile("");
    setAddress("");
  };

  const save = async () => {
    const nm = String(name ?? "").trim();
    if (!nm) return alert("Name required");

    try {
      setSaving(true);

      const res = await fetch(`${apiBase}/contractors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: nm,
          mobile: String(mobile ?? "").trim() || undefined,
          address: String(address ?? "").trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Create failed");

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
          <DialogTitle>Add Labour Contractor</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
