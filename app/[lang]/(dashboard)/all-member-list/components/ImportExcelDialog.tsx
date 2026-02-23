"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IMPORT_API } from "./api";

export default function ImportExcelDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => Promise<void> | void; // after import -> refresh list
}) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const closeAndReset = () => {
    setSelectedFile(null);
    onOpenChange(false);
  };

  const doImport = async () => {
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select an Excel file (.xlsx / .xls).",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch(IMPORT_API, { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Import failed");
      }

      toast({
        title: "Import Success",
        description: `Created: ${json.created ?? 0}, Updated: ${json.updated ?? 0}, Skipped: ${json.skipped ?? 0}`,
      });

      closeAndReset();
      await onImported();
    } catch (err: any) {
      toast({
        title: "Import Error",
        description: err?.message ?? "Import failed",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : closeAndReset())}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import Member List (Excel)</DialogTitle>
          <DialogDescription>
            Select .xlsx / .xls file. Import के बाद data database में store होगा और list auto refresh होकर दिखेगी।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            Required Columns:
            <div className="mt-1 text-xs opacity-70">
              Name, Father / Husband Name, Mobile No, Block, Floor, Flat
            </div>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            className="block w-full text-sm"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />

          {selectedFile ? (
            <div className="text-xs opacity-80">
              Selected: <b>{selectedFile.name}</b>
            </div>
          ) : (
            <div className="text-xs opacity-60">No file selected</div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={closeAndReset} disabled={importing}>
            Cancel
          </Button>

          <Button type="button" variant="outline" onClick={doImport} disabled={importing}>
            {importing ? "Importing..." : "Import Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}