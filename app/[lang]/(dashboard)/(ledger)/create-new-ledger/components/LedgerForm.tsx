"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AddLedgerType from "./AddLedgerType";

/* ================= TYPES ================= */
interface LedgerType {
  id: string;
  name: string;
}

interface Site {
  id: string;
  siteName: string;
}

/* ================= API BASE ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= COMPONENT ================= */
export default function LedgerForm() {
  const { toast } = useToast();

  const [ledgerTypes, setLedgerTypes] = useState<LedgerType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [ledgerTypeDialog, setLedgerTypeDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    ledgerTypeId: "",
    siteId: "",
    ledgerName: "",
    address: "",
    mobile: "",
    openingBalance: "",
    closingBalance: "",
    remark: "",
  };

  const [form, setForm] = useState(initialForm);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchLedgerTypes();
    fetchSites();
  }, []);

  const fetchLedgerTypes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/ledger-types`, {
        credentials: "include",
      });
      const json = await res.json();
      setLedgerTypes(json?.data ?? []);
    } catch {
      setLedgerTypes([]);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sites`, {
        credentials: "include",
      });
      const json = await res.json();
      setSites(json?.data ?? []);
    } catch {
      setSites([]);
    }
  };

  /* ================= HANDLERS ================= */
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  const handleSubmit = async () => {
    if (!form.ledgerTypeId || !form.ledgerName) {
      toast({
        title: "❌ Required Fields Missing",
        description: "Ledger Type and Ledger Name are required",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${BASE_URL}/api/ledgers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ledgerTypeId: form.ledgerTypeId,
          siteId: form.siteId || null,
          name: form.ledgerName,
          address: form.address,
          mobile: form.mobile,
          openingBalance: form.openingBalance || null,
          closingBalance: form.closingBalance || null,
          remark: form.remark,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Ledger Saved",
        description: "Ledger created successfully",
      });

      // 🔥 RESET AFTER SAVE
      setForm(initialForm);
    } catch (err: any) {
      toast({
        title: "❌ Save Failed",
        description: err.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <div className="space-y-6">

        {/* ================= HEADER CARD ================= */}
        <Card className="p-5 space-y-4">
          <h3 className="text-lg font-semibold">Select Ledger & Site</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Ledger Type */}
            <div>
              <Label>Ledger Type</Label>
              <div className="flex gap-2">
                <Select
                  value={form.ledgerTypeId}
                  onValueChange={(value) =>
                    setForm({ ...form, ledgerTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ledger Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ledgerTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id}>
                        {lt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setLedgerTypeDialog(true)}
                >
                  + Add
                </Button>
              </div>
            </div>

            {/* Site */}
            <div>
              <Label>Site</Label>
              <Select
                value={form.siteId}
                onValueChange={(value) =>
                  setForm({ ...form, siteId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.siteName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </Card>

        {/* ================= LEDGER FORM ================= */}
        <Card className="p-6 space-y-6">
          <h3 className="text-xl font-semibold">Ledger Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="ledgerName" value={form.ledgerName} onChange={handleChange} placeholder="Ledger Name" />
            <Input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile No." />
            <Input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="openingBalance" value={form.openingBalance} onChange={handleChange} placeholder="Opening Balance" />
            <Input name="closingBalance" value={form.closingBalance} onChange={handleChange} placeholder="Closing Balance" />
            <Input name="remark" value={form.remark} onChange={handleChange} placeholder="Remark" />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>

      {/* ================= LEDGER TYPE MASTER DIALOG ================= */}
      <AddLedgerType
        open={ledgerTypeDialog}
        onClose={() => setLedgerTypeDialog(false)}
        onChanged={fetchLedgerTypes}
      />
    </>
  );
}
