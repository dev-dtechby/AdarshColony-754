"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

/**
 * ImportMemberList.tsx
 * - Excel Import Button (xlsx/xls)
 * - Uploads as multipart/form-data with field name: "file"
 *
 * Default API:
 *   NEXT_PUBLIC_API_BASE_URL + /api/colony-members/import
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const DEFAULT_IMPORT_URL = `${API_BASE}/api/colony-members/import`;

type ImportResult = {
  ok?: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  message?: string;
};

// ✅ Your Button supports only these variants (as per TS error)
type ButtonVariant = "outline" | "ghost" | "soft" | null | undefined;

export default function ImportMemberList({
  importUrl = DEFAULT_IMPORT_URL,
  onImported,
  disabled,
  buttonLabel = "Import Excel",
  variant = "outline",
}: {
  importUrl?: string;
  onImported?: () => void;
  disabled?: boolean;
  buttonLabel?: string;
  variant?: ButtonVariant;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file); // backend expects "file"

      const res = await fetch(importUrl, {
        method: "POST",
        body: fd,
      });

      const json: ImportResult = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Import failed");
      }

      toast({
        title: "Import Success",
        description: `Created: ${json.created ?? 0}, Updated: ${json.updated ?? 0}, Skipped: ${json.skipped ?? 0}`,
      });

      onImported?.();
    } catch (e: any) {
      toast({
        title: "Import Error",
        description: e?.message ?? "Import failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
        }}
      />

      <Button
        type="button"
        variant={variant ?? undefined}
        onClick={pickFile}
        disabled={disabled || uploading}
      >
        {uploading ? "Importing..." : buttonLabel}
      </Button>
    </>
  );
}