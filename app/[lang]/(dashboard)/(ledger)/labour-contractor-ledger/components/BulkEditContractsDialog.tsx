"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

type Row = {
  contractId: string;
  siteName: string;
  agreedAmount: any;
  agreementUrl?: string | null;
  agreementName?: string | null;
};

export default function BulkEditContractsDialog({
  open,
  onClose,
  apiBase,
  contractRows,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  contractRows: Row[];
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(
      (contractRows || []).map((r) => ({
        contractId: String(r.contractId),
        siteName: String(r.siteName || ""),
        agreedAmount: String(r.agreedAmount ?? ""),
        agreementUrl: r.agreementUrl ?? "",
        agreementName: r.agreementName ?? "",
      }))
    );
  }, [open, contractRows]);

  const validRow = (r: Row) => n(r.agreedAmount) > 0;

  const canSave = useMemo(() => {
    if (!rows.length) return false;
    return rows.every(validRow);
  }, [rows]);

  const patchRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.contractId === id ? { ...r, ...patch } : r)));
  };

  const saveAll = async () => {
    if (!canSave) return;
    try {
      setSaving(true);

      await Promise.all(
        rows.map(async (r) => {
          const res = await fetch(`${apiBase}/contracts/${r.contractId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agreedAmount: n(r.agreedAmount),
              agreementUrl: String(r.agreementUrl || "").trim() || null,
              agreementName: String(r.agreementName || "").trim() || null,
            }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || "Bulk update failed");
        })
      );

      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      {/* ✅ FIX: same as earlier bulk-edit layout fix (height + flex + single scroll) */}
      <DialogContent className="!max-w-[1100px] !h-[92vh] !p-0 !flex !flex-col overflow-hidden">
        {/* Header fixed */}
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Bulk Edit Contracts</DialogTitle>
          <div className="text-xs text-muted-foreground">
            Selected rows: <b>{rows.length}</b>
          </div>
        </DialogHeader>

        {/* Single scroll container */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <Card className="rounded-xl border overflow-hidden">
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 980 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-muted/80 border-b">
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-right">Agreed</th>
                      <th className="px-3 py-2 text-left">Agreement Name</th>
                      <th className="px-3 py-2 text-left">Agreement URL</th>
                      <th className="px-3 py-2 text-left w-32">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r) => {
                      const ok = validRow(r);
                      return (
                        <tr
                          key={r.contractId}
                          className={cn("border-t", ok ? "bg-green-500/5" : "hover:bg-primary/5")}
                        >
                          <td className="px-3 py-2">{r.siteName}</td>

                          <td className="px-3 py-2 text-right">
                            <Input
                              className="h-8 w-36 ml-auto"
                              value={String(r.agreedAmount)}
                              onChange={(e) => patchRow(r.contractId, { agreedAmount: e.target.value })}
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <Input
                              className="h-8"
                              value={String(r.agreementName ?? "")}
                              onChange={(e) => patchRow(r.contractId, { agreementName: e.target.value })}
                              placeholder="Agreement.pdf"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <Input
                              className="h-8"
                              value={String(r.agreementUrl ?? "")}
                              onChange={(e) => patchRow(r.contractId, { agreementUrl: e.target.value })}
                              placeholder="https://..."
                            />
                          </td>

                          <td className="px-3 py-2">
                            {ok ? (
                              <div className="text-xs font-medium text-green-600">Ready</div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Agreed required</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!rows.length ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          No selected contracts
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer fixed */}
        <div className="p-4 border-t bg-background/60 backdrop-blur shrink-0 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            Valid rows: <b>{rows.filter(validRow).length}</b> / {rows.length}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveAll} disabled={!canSave || saving}>
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
