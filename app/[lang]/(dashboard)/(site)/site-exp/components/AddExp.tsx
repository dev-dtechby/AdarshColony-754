"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

/* ========= SHADCN ========= */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

export default function AddExp({
  onClose,
  onSaved,
}: {
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const { toast } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [openGuide, setOpenGuide] = useState(false);

  const [form, setForm] = useState({
    siteId: "",
    expenseDate: "",
    expenseTitle: "",
    expenseSummary: "",
    paymentDetails: "",
    amount: "",
  });

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    fetch(SITE_API)
      .then((r) => r.json())
      .then((j) => setSites(j.data || []));
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const resetForm = () =>
    setForm({
      siteId: "",
      expenseDate: "",
      expenseTitle: "",
      expenseSummary: "",
      paymentDetails: "",
      amount: "",
    });

  /* ================= SAVE SINGLE ================= */
  const handleSave = async () => {
    if (!form.siteId || !form.expenseDate || !form.amount) {
      toast({ title: "❌ Required fields missing" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(EXP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast({ title: "✅ Expense Saved Successfully" });
      onSaved?.();
      resetForm();
      onClose?.();
    } catch {
      toast({ title: "❌ Expense save failed" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMPORT EXCEL (SITE NAME BASED) ================= */
  const handleExcelImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) throw new Error();

      for (const row of rows) {
        const site = sites.find(
          (s) =>
            s.siteName.trim().toLowerCase() ===
            String(row.siteName).trim().toLowerCase()
        );

        if (!site) {
          throw new Error(`Invalid site name: ${row.siteName}`);
        }

        await fetch(EXP_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: site.id,
            expenseDate: row.expenseDate,
            expenseTitle: row.expenseTitle,
            expenseSummary: row.expenseSummary,
            paymentDetails: row.paymentDetails,
            amount: row.amount,
          }),
        });
      }

      toast({ title: "✅ Bulk Import Completed Successfully" });
      onSaved?.();
      onClose?.();
    } catch (err: any) {
      toast({
        title: "❌ Import Failed",
        description: err.message || "Invalid Excel format",
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Card className="p-6 space-y-5">
        <h2 className="text-xl font-semibold">Add Expense Entry</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Select Site</Label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={form.siteId}
              onChange={(e) => handleChange("siteId", e.target.value)}
            >
              <option value="">Select</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.expenseDate}
              onChange={(e) =>
                handleChange("expenseDate", e.target.value)
              }
            />
          </div>

          <div>
            <Label>Expenses (Details)</Label>
            <Input
              placeholder="Diesel for JCB"
              value={form.expenseTitle}
              onChange={(e) =>
                handleChange("expenseTitle", e.target.value)
              }
            />
          </div>

          <div>
            <Label>Exp. Summary</Label>
            <Input
              placeholder="Petrol / Labour / Transport"
              value={form.expenseSummary}
              onChange={(e) =>
                handleChange("expenseSummary", e.target.value)
              }
            />
          </div>

          <div>
            <Label>Payment Details</Label>
            <Input
              placeholder="Cash / UPI / Bank"
              value={form.paymentDetails}
              onChange={(e) =>
                handleChange("paymentDetails", e.target.value)
              }
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="₹ Amount"
              value={form.amount}
              onChange={(e) =>
                handleChange("amount", e.target.value)
              }
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={loading}>
            Save
          </Button>

          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>

          {/* IMPORT */}
          <label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleExcelImport}
            />
            <Button variant="outline" asChild>
              <span>Import Excel</span>
            </Button>
          </label>

          <Button variant="ghost" onClick={() => setOpenGuide(true)}>
            Import Format
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Card>

      {/* ================= IMPORT GUIDE ================= */}
      <Dialog open={openGuide} onOpenChange={setOpenGuide}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Excel Import Format</DialogTitle>
          </DialogHeader>

          <div className="text-sm space-y-3">
            <p className="font-medium">Excel columns must be exactly:</p>

            <pre className="bg-muted p-3 rounded text-xs">
siteName | expenseDate | expenseTitle | expenseSummary | paymentDetails | amount
            </pre>

            <p>✔ siteName must exactly match Site Master</p>
            <p>✔ expenseDate format: <b>YYYY-MM-DD</b></p>
            <p>✔ amount must be numeric</p>

            <p className="text-red-500">
              ❌ Column names must not be changed
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
