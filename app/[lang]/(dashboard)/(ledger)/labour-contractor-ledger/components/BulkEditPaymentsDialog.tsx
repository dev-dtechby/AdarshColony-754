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

const toDateInput = (d: any) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type Row = {
  id: string;
  paymentDate: string;
  siteId: string;
  mode: string;
  refNo?: string | null;
  through?: string | null;
  amount: any;
};

export default function BulkEditPaymentsDialog({
  open,
  onClose,
  apiBase,
  sites,
  paymentRows,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  sites: any[];
  paymentRows: any[];
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(
      (paymentRows || []).map((p) => ({
        id: String(p.id),
        paymentDate: toDateInput(p.paymentDate),
        siteId: String(p.siteId || p.site?.id || ""),
        mode: String(p.mode || "CASH"),
        refNo: p.refNo ?? "",
        through: p.through ?? "",
        amount: String(p.amount ?? ""),
      }))
    );
  }, [open, paymentRows]);

  const validRow = (r: Row) => !!r.paymentDate && !!r.siteId && n(r.amount) > 0;

  const canSave = useMemo(() => {
    if (!rows.length) return false;
    return rows.every(validRow);
  }, [rows]);

  const patchRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveAll = async () => {
    if (!canSave) return;
    try {
      setSaving(true);

      await Promise.all(
        rows.map(async (r) => {
          const res = await fetch(`${apiBase}/payments/${r.id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentDate: r.paymentDate,
              siteId: r.siteId,
              mode: r.mode,
              refNo: String(r.refNo || "").trim() || null,
              through: String(r.through || "").trim() || null,
              amount: n(r.amount),
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
      {/* ✅ FIX: Full height, flex column, overflow hidden (same as earlier fix pattern) */}
      <DialogContent className="!max-w-[1200px] !h-[92vh] !p-0 !flex !flex-col overflow-hidden">
        {/* ✅ Header fixed */}
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Bulk Edit Payments</DialogTitle>
          <div className="text-xs text-muted-foreground">
            Selected rows: <b>{rows.length}</b>
          </div>
        </DialogHeader>

        {/* ✅ Single scroll area */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <Card className="rounded-xl border overflow-hidden">
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 1120 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-muted/80 border-b">
                    <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Ref No</th>
                      <th className="px-3 py-2 text-left">Through</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left w-28">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r) => {
                      const ok = validRow(r);
                      return (
                        <tr key={r.id} className={cn("border-t", ok ? "bg-green-500/5" : "hover:bg-primary/5")}>
                          <td className="px-3 py-2">
                            <Input
                              type="date"
                              className="h-8 w-40"
                              value={r.paymentDate}
                              onChange={(e) => patchRow(r.id, { paymentDate: e.target.value })}
                            />
                          </td>

                          <td className="px-3 py-2">
                            <select
                              className="border bg-background px-2 py-1.5 rounded-md text-sm h-8 w-56"
                              value={r.siteId}
                              onChange={(e) => patchRow(r.id, { siteId: e.target.value })}
                            >
                              <option value="">Select Site</option>
                              {sites.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.siteName}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-2">
                            <select
                              className="border bg-background px-2 py-1.5 rounded-md text-sm h-8 w-32"
                              value={r.mode}
                              onChange={(e) => patchRow(r.id, { mode: e.target.value })}
                            >
                              <option value="CASH">CASH</option>
                              <option value="BANK">BANK</option>
                              <option value="UPI">UPI</option>
                              <option value="CHEQUE">CHEQUE</option>
                            </select>
                          </td>

                          <td className="px-3 py-2">
                            <Input
                              className="h-8 w-44"
                              value={String(r.refNo ?? "")}
                              onChange={(e) => patchRow(r.id, { refNo: e.target.value })}
                            />
                          </td>

                          <td className="px-3 py-2">
                            <Input
                              className="h-8 w-44"
                              value={String(r.through ?? "")}
                              onChange={(e) => patchRow(r.id, { through: e.target.value })}
                            />
                          </td>

                          <td className="px-3 py-2 text-right">
                            <Input
                              className="h-8 w-36 ml-auto"
                              value={String(r.amount)}
                              onChange={(e) => patchRow(r.id, { amount: e.target.value })}
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-2">
                            {ok ? (
                              <div className="text-xs font-medium text-green-600">Ready</div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Required</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!rows.length ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No selected payments
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* ✅ Footer fixed */}
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
