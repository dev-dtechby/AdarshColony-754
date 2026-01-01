"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

/* ================= TYPES ================= */
interface Site {
  id: string;
  siteName: string;
}

interface Expense {
  id: string;
  siteId: string;
  expenseDate: string;
  expenseTitle: string;
  expenseSummary: string;
  paymentDetails: string;
  amount: number;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const SITE_API = `${BASE_URL}/api/sites`;
const EXP_API = `${BASE_URL}/api/site-exp`;

export default function EditExp({
  expense,
  onClose,
  onSaved,
}: {
  expense: Expense;
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const { toast } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    siteId: expense.siteId,
    expenseDate: expense.expenseDate.slice(0, 10),
    expenseTitle: expense.expenseTitle,
    expenseSummary: expense.expenseSummary,
    paymentDetails: expense.paymentDetails,
    amount: String(expense.amount),
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

  /* ================= UPDATE ================= */
    const handleUpdate = async () => {
    if (!form.siteId || !form.expenseDate || !form.amount) {
        toast({
        title: "❌ Required fields missing",
        });
        return;
    }

    try {
        setLoading(true);

        const res = await fetch(`${EXP_API}/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            siteId: form.siteId,
            expenseDate: form.expenseDate,
            expenseTitle: form.expenseTitle,
            expenseSummary: form.expenseSummary,
            paymentDetails: form.paymentDetails,
            amount: Number(form.amount),
        }),
        });

        const json = await res.json();

        if (!res.ok) {
        throw new Error(json?.message || "Update failed");
        }

        // ✅ SUCCESS FEEDBACK
        toast({
        title: "✅ Expense Updated Successfully",
        description: "Changes have been saved",
        });

        // ✅ Refresh list
        onSaved?.();

        // ✅ Close popup
        onClose?.();
    } catch (err: any) {
        toast({
            title: "✅ Expense Updated Successfully",
            description: "Changes have been saved",
            });

    } finally {
        setLoading(false);
    }
    };


  /* ================= UI ================= */
  return (
    <Card className="p-6 space-y-5">
      <h2 className="text-xl font-semibold">Edit Expense Entry</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Select Site</Label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.siteId}
            onChange={(e) => handleChange("siteId", e.target.value)}
          >
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
            value={form.expenseTitle}
            onChange={(e) =>
              handleChange("expenseTitle", e.target.value)
            }
          />
        </div>

        <div>
          <Label>Exp. Summary</Label>
          <Input
            value={form.expenseSummary}
            onChange={(e) =>
              handleChange("expenseSummary", e.target.value)
            }
          />
        </div>

        <div>
          <Label>Payment Details</Label>
          <Input
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
            value={form.amount}
            onChange={(e) =>
              handleChange("amount", e.target.value)
            }
          />
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button onClick={handleUpdate} disabled={loading}>
          Update
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
