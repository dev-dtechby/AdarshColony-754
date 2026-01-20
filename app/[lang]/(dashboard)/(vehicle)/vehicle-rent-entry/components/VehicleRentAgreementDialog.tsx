"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { API } from "./vehicle-rent.api";

export default function VehicleRentAgreementDialog({
  open,
  onClose,
  vehicleId,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  onUploaded?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!vehicleId || !file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(API.agreement(vehicleId), {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Upload failed");

      onUploaded?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Upload Agreement</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-3">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={upload} disabled={!file || uploading} className="gap-2">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
