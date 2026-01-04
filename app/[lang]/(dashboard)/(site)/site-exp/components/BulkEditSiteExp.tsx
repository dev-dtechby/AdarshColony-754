"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Site = { id: string; siteName: string };

type ExpenseRow = {
  id: string;
  expenseDate: string;
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: number;
  site?: { id: string; siteName: string };
};

type EditableRow = {
  id: string;
  siteId: string;
  expenseDate: string; // yyyy-mm-dd
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: string;
};

const toInputDate = (val: string) => {
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const cleanAmount = (v: string) => Number(String(v).replace(/,/g, "").trim());

const normalizeRow = (r: EditableRow) => ({
  siteId: r.siteId || "",
  expenseDate: r.expenseDate || "",
  expenseTitle: (r.expenseTitle || "").trim(),
  summary: (r.summary || "").trim(),
  paymentDetails: (r.paymentDetails || "").trim(),
  amount: String(cleanAmount(r.amount || "")),
});

export default function BulkEditSiteExp(props: {
  rows: ExpenseRow[];
  sites: Site[];
  baseUrl: string;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { rows, sites, baseUrl, onCancel, onSaved } = props;

  const EXP_API = useMemo(() => `${baseUrl}/api/site-exp`, [baseUrl]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formRows, setFormRows] = useState<EditableRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const originalMapRef = useRef<Record<string, EditableRow>>({});

  useEffect(() => {
    setErrors({});
    const mapped = rows.map((r) => ({
      id: r.id,
      siteId: r.site?.id || "",
      expenseDate: toInputDate(r.expenseDate),
      expenseTitle: r.expenseTitle || "",
      summary: r.summary || "",
      paymentDetails: r.paymentDetails || "",
      amount: String(r.amount ?? ""),
    }));

    setFormRows(mapped);
    setDirtyIds(new Set());

    const snap: Record<string, EditableRow> = {};
    mapped.forEach((m) => (snap[m.id] = m));
    originalMapRef.current = snap;
  }, [rows]);

  const markDirtyIfChanged = (rowId: string, nextRow: EditableRow) => {
    const original = originalMapRef.current[rowId];
    if (!original) return;

    const a = normalizeRow(original);
    const b = normalizeRow(nextRow);

    const changed =
      a.siteId !== b.siteId ||
      a.expenseDate !== b.expenseDate ||
      a.expenseTitle !== b.expenseTitle ||
      a.summary !== b.summary ||
      a.paymentDetails !== b.paymentDetails ||
      a.amount !== b.amount;

    setDirtyIds((prev) => {
      const next = new Set(prev);
      if (changed) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const updateRow = (id: string, patch: Partial<EditableRow>) => {
    setFormRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextRow = { ...r, ...patch };
        markDirtyIfChanged(id, nextRow);
        return nextRow;
      })
    );
  };

  const removeRow = (id: string) => {
    setFormRows((prev) => prev.filter((r) => r.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const resetAllChanges = () => {
    const snap = originalMapRef.current;
    setFormRows((prev) => prev.map((r) => snap[r.id] || r));
    setErrors({});
    setDirtyIds(new Set());
  };

  const validateOnly = (rowsToValidate: EditableRow[]) => {
    const nextErr: Record<string, string> = {};

    for (const r of rowsToValidate) {
      if (!r.siteId) nextErr[r.id] = "Site required";
      else if (!r.expenseDate) nextErr[r.id] = "Date required";
      else if (!r.expenseTitle?.trim()) nextErr[r.id] = "Expenses required";
      else {
        const amt = cleanAmount(r.amount);
        if (!amt || isNaN(amt) || amt <= 0) nextErr[r.id] = "Amount must be > 0";
      }
    }

    setErrors((prev) => {
      const cleaned: Record<string, string> = {};
      for (const k of Object.keys(prev)) {
        if (!rowsToValidate.find((x) => x.id === k)) cleaned[k] = prev[k];
      }
      return { ...cleaned, ...nextErr };
    });

    return Object.keys(nextErr).length === 0;
  };

  const saveEditedOnly = async () => {
    const editedRows = formRows.filter((r) => dirtyIds.has(r.id));

    if (editedRows.length === 0) {
      alert("No changes to update.");
      return;
    }

    if (!validateOnly(editedRows)) return;

    try {
      setSaving(true);

      await Promise.all(
        editedRows.map(async (r) => {
          const amt = cleanAmount(r.amount);

          const payload = {
            siteId: r.siteId,
            expenseDate: new Date(r.expenseDate).toISOString(),
            expenseTitle: r.expenseTitle,
            expenseSummary: r.summary,
            paymentDetails: r.paymentDetails,
            amount: amt,
          };

          const res = await fetch(`${EXP_API}/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });

          const json = await res.json().catch(() => null);
          if (!res.ok) throw new Error(json?.message || `Update failed for id ${r.id}`);
        })
      );

      setDirtyIds(new Set());
      await onSaved?.(); // parent: close + refresh
    } catch (e: any) {
      alert(e?.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const editedCount = dirtyIds.size;

  return (
    // ✅ IMPORTANT: flex + min-h-0 chain (scroll will work)
    <div className="h-full min-h-0 flex flex-col">
      {/* ✅ TOP BAR (buttons always visible, wrap/scroll safe) */}
      <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3 border-b bg-background/60 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            Bulk Edit Site Expenses ({formRows.length})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">
            Header freeze रहेगा, sirf rows scroll होंगी. Update = sirf edited rows.
          </div>

          {/* buttons row - never overflow out */}
          <div className="max-w-full overflow-x-auto">
            <div className="flex flex-wrap items-center gap-2 min-w-max">
              <span className="px-2 py-1 rounded-md border bg-muted/30 text-xs">
                Selected: <b>{formRows.length}</b>
              </span>
              <span className="px-2 py-1 rounded-md border bg-muted/30 text-xs">
                Edited: <b>{editedCount}</b>
              </span>
              <span
                className={`px-2 py-1 rounded-md border text-xs ${
                  errorCount ? "border-red-500/40 bg-red-500/10" : "bg-muted/30"
                }`}
              >
                Errors: <b>{errorCount}</b>
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={resetAllChanges}
                disabled={saving || editedCount === 0}
              >
                Reset
              </Button>

              <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={saveEditedOnly}
                disabled={saving || editedCount === 0 || formRows.length === 0}
              >
                {saving ? "Updating..." : `Update (${editedCount})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ONLY THIS AREA SCROLLS */}
      <div className="flex-1 min-h-0 p-3 md:p-4">
        <div className="h-full min-h-0 rounded-xl border bg-card/40 overflow-hidden flex flex-col">
          {/* ✅ REAL scroll container */}
          <div
            className="flex-1 min-h-0 overflow-auto"
            style={{
              scrollbarGutter: "stable",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {/* ===== DESKTOP TABLE ===== */}
            <div className="hidden md:block">
              <div className="min-w-[1450px]">
                <table className="w-full text-sm border-collapse">
                  {/* ✅ sticky header inside scroll container */}
                  <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-3 text-center w-10"> </th>
                      <th className="px-3 py-3 text-left">Site</th>
                      <th className="px-3 py-3 text-left">Date</th>
                      <th className="px-3 py-3 text-left">Expenses</th>
                      <th className="px-3 py-3 text-left">Exp. Summary</th>
                      <th className="px-3 py-3 text-left">Payment</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-left w-56">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formRows.map((r) => {
                      const isDirty = dirtyIds.has(r.id);

                      return (
                        <tr
                          key={r.id}
                          className={`border-t transition ${
                            isDirty ? "bg-primary/10" : "hover:bg-primary/5"
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(r.id)}
                              disabled={saving}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition disabled:opacity-50"
                              title="Remove row"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>

                          <td className="px-3 py-3">
                            <select
                              className="border bg-background px-2 py-2 rounded-md text-sm w-64"
                              value={r.siteId}
                              onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                              disabled={saving}
                            >
                              <option value="">Select Site</option>
                              {sites.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.siteName}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              type="date"
                              value={r.expenseDate}
                              onChange={(e) => updateRow(r.id, { expenseDate: e.target.value })}
                              disabled={saving}
                              className="w-44"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.expenseTitle}
                              onChange={(e) => updateRow(r.id, { expenseTitle: e.target.value })}
                              disabled={saving}
                              className="w-64"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.summary}
                              onChange={(e) => updateRow(r.id, { summary: e.target.value })}
                              disabled={saving}
                              className="w-80"
                            />
                          </td>

                          <td className="px-3 py-3">
                            <Input
                              value={r.paymentDetails}
                              onChange={(e) =>
                                updateRow(r.id, { paymentDetails: e.target.value })
                              }
                              disabled={saving}
                              className="w-64"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              value={r.amount}
                              onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                              disabled={saving}
                              className="w-40 text-right"
                              inputMode="decimal"
                            />
                          </td>

                          <td className="px-3 py-3">
                            {errors[r.id] ? (
                              <span className="text-xs text-red-400">{errors[r.id]}</span>
                            ) : isDirty ? (
                              <span className="text-xs text-yellow-400">Edited</span>
                            ) : (
                              <span className="text-xs text-green-400">OK</span>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-1">
                              ID: {r.id}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {formRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No rows selected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== MOBILE CARDS (vertical scroll inside same container) ===== */}
            <div className="md:hidden p-3 space-y-3">
              {formRows.map((r, idx) => {
                const isDirty = dirtyIds.has(r.id);

                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border bg-background/20 p-3 space-y-2 ${
                      errors[r.id]
                        ? "border-red-500/40"
                        : isDirty
                        ? "border-yellow-500/40"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Row {idx + 1}{" "}
                        {isDirty && <span className="ml-2 text-yellow-400">• Edited</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        disabled={saving}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/30 hover:bg-muted/40 transition disabled:opacity-50"
                        title="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-2">
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Site</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.siteId}
                          onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Site</option>
                          {sites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.siteName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Date</div>
                        <Input
                          type="date"
                          value={r.expenseDate}
                          onChange={(e) => updateRow(r.id, { expenseDate: e.target.value })}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Expenses</div>
                        <Input
                          value={r.expenseTitle}
                          onChange={(e) =>
                            updateRow(r.id, { expenseTitle: e.target.value })
                          }
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">
                          Exp. Summary
                        </div>
                        <Input
                          value={r.summary}
                          onChange={(e) => updateRow(r.id, { summary: e.target.value })}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Payment</div>
                        <Input
                          value={r.paymentDetails}
                          onChange={(e) =>
                            updateRow(r.id, { paymentDetails: e.target.value })
                          }
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Amount</div>
                        <Input
                          value={r.amount}
                          onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                          disabled={saving}
                          inputMode="decimal"
                        />
                      </div>

                      <div className="pt-1">
                        {errors[r.id] ? (
                          <span className="text-xs text-red-400">{errors[r.id]}</span>
                        ) : (
                          <span className="text-xs text-green-400">OK</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {formRows.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">No rows selected</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
