"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function VoucherForm() {
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sites, setSites] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    siteId: "",
    departmentId: "",
    departmentName: "",

    grossAmt: "",
    withheld: "",
    incomeTax: "",
    revenue: "",
    lwf: "",
    royalty: "",
    miscDeduction: "",
    karmkarTax: "",
    securedDeposit: "",
    tdsOnGst: "",
    tds: "",
    performanceGuarantee: "",
    gst: "",
    improperFinishing: "",
    otherDeduction: "",
    deductionAmt: "",
    chequeAmt: "",
  });

  /* ================= FETCH SITES ================= */
  useEffect(() => {
    fetch(`${BASE_URL}/api/sites?_ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setSites(list);
      })
      .catch(() => setSites([]));
  }, []);

  /* ================= FETCH DEPARTMENTS ================= */
  useEffect(() => {
    fetch(`${BASE_URL}/api/departments?_ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setDepartments(list);
      })
      .catch(() => setDepartments([]));
  }, []);

  /* ================= DEPT MAP ================= */
  const deptMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const dep of departments) {
      if (dep?.id) m.set(dep.id, dep.name || "");
    }
    return m;
  }, [departments]);

  /* ================= AUTO RESOLVE DEPARTMENT =================
     ✅ FIX: If deptMap loads after site selection, this will still fill dept name.
  ============================================================ */
  useEffect(() => {
    if (!form.siteId) {
      // clear
      setForm((p: any) => {
        if (!p.departmentId && !p.departmentName) return p;
        return { ...p, departmentId: "", departmentName: "" };
      });
      return;
    }

    const selectedSite = sites.find((s) => s.id === form.siteId);

    const depIdFromObj = selectedSite?.department?.id || "";
    const depNameFromObj = selectedSite?.department?.name || "";

    const depIdFromField = selectedSite?.departmentId || "";

    const finalDeptId = depIdFromObj || depIdFromField || "";
    const finalDeptName =
      depNameFromObj || (finalDeptId ? deptMap.get(finalDeptId) : "") || "";

    setForm((p: any) => {
      if (p.departmentId === finalDeptId && p.departmentName === finalDeptName) return p;
      return { ...p, departmentId: finalDeptId, departmentName: finalDeptName };
    });
  }, [form.siteId, sites, deptMap]);

  /* ================= HANDLERS ================= */
  const handleChange = (key: string, value: any) => {
    setForm((p: any) => ({ ...p, [key]: value }));
  };

  const handleSiteChange = (siteId: string) => {
    // ✅ only set siteId here; department resolved by useEffect above
    setForm((p: any) => ({
      ...p,
      siteId,
      departmentId: "",
      departmentName: "",
    }));
  };

  const resetForm = () => {
    setDate(new Date());
    setForm({
      siteId: "",
      departmentId: "",
      departmentName: "",

      grossAmt: "",
      withheld: "",
      incomeTax: "",
      revenue: "",
      lwf: "",
      royalty: "",
      miscDeduction: "",
      karmkarTax: "",
      securedDeposit: "",
      tdsOnGst: "",
      tds: "",
      performanceGuarantee: "",
      gst: "",
      improperFinishing: "",
      otherDeduction: "",
      deductionAmt: "",
      chequeAmt: "",
    });
  };

  const handleSave = async () => {
    if (!form.siteId || !form.departmentId || !form.chequeAmt) {
      toast({
        title: "Validation Error",
        description: "Site, Department and Cheque Amt are required",
      });
      return;
    }

    const res = await fetch(`${BASE_URL}/api/vouchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voucherDate: date,
        ...form,
      }),
    });

    if (res.ok) {
      toast({ title: "Success", description: "Voucher saved successfully" });
      resetForm();
      return;
    }

    toast({ title: "Error", description: "Failed to save voucher" });
  };

  return (
    <Card className="p-6 shadow-sm border rounded-xl bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Voucher Entry Form</CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <Label>Voucher Date</Label>
            <Popover>
              <PopoverTrigger className="w-full">
                <div className="flex justify-between px-3 py-2 border rounded-md cursor-pointer">
                  {date?.toLocaleDateString()}
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label>Site</Label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={form.siteId}
              onChange={(e) => handleSiteChange(e.target.value)}
            >
              <option value="">Select Site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Department</Label>
            <Input
              value={form.departmentName}
              placeholder="Department auto-selected"
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            ["Gross Amt", "grossAmt"],
            ["Withheld", "withheld"],
            ["Income Tax", "incomeTax"],
            ["Revenue", "revenue"],
            ["LWF", "lwf"],
            ["Royalty", "royalty"],
            ["Misc. Deduction", "miscDeduction"],
            ["Karmkar Tax", "karmkarTax"],
            ["Secured Deposit", "securedDeposit"],
            ["TDS on GST", "tdsOnGst"],
            ["TDS", "tds"],
            ["Performance Guarantee", "performanceGuarantee"],
            ["GST", "gst"],
            ["Improper Finishing", "improperFinishing"],
            ["Other Deduction", "otherDeduction"],
            ["Deduction Amt", "deductionAmt"],
            ["Cheque Amt (Actual Received)", "chequeAmt"],
          ].map(([label, key]) => (
            <div key={key as string} className="grid grid-cols-2 gap-3 items-center">
              <Label className="font-medium">{label}</Label>
              <Input
                type="number"
                value={form[key]}
                onChange={(e) => handleChange(key as string, e.target.value)}
                placeholder={`Enter ${label}`}
              />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Label>Upload Voucher</Label>
          <Button variant="outline" className="w-full flex gap-2 justify-center">
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 pt-6">
          <Button className="px-10" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outline" className="px-10" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
