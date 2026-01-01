"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/* ================= CONFIG ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

/* ================= PROPS ================= */
interface Props {
  voucherId: string;
}

/* ================= COMPONENT ================= */
export default function EditVoucher({ voucherId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  /* ================= LOAD SITES ================= */
  useEffect(() => {
    fetch(`${BASE_URL}/api/sites`)
      .then((r) => r.json())
      .then((d) => setSites(d.data || []));
  }, []);

  /* ================= LOAD VOUCHER ================= */
  useEffect(() => {
    if (!voucherId || sites.length === 0) return;

    fetch(`${BASE_URL}/api/vouchers/${voucherId}`)
      .then((r) => r.json())
      .then((res) => {
        const v = res.data;
        const site = sites.find((s) => s.id === v.siteId);

        setDate(new Date(v.voucherDate));
        setForm({
          siteId: v.siteId,
          departmentId: site?.department?.id || "",
          departmentName: site?.department?.name || "",

          grossAmt: v.grossAmt ?? "",
          withheld: v.withheld ?? "",
          incomeTax: v.incomeTax ?? "",
          revenue: v.revenue ?? "",
          lwf: v.lwf ?? "",
          royalty: v.royalty ?? "",
          miscDeduction: v.miscDeduction ?? "",
          karmkarTax: v.karmkarTax ?? "",
          securedDeposit: v.securedDeposit ?? "",
          tdsOnGst: v.tdsOnGst ?? "",
          tds: v.tds ?? "",
          performanceGuarantee: v.performanceGuarantee ?? "",
          gst: v.gst ?? "",
          improperFinishing: v.improperFinishing ?? "",
          otherDeduction: v.otherDeduction ?? "",
          deductionAmt: v.deductionAmt ?? "",
          chequeAmt: v.chequeAmt ?? "",
        });

        setLoading(false);
      });
  }, [voucherId, sites]);

  /* ================= HANDLERS ================= */
  const handleChange = (key: string, value: any) => {
    setForm((p: any) => ({ ...p, [key]: value }));
  };

  const handleSiteChange = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);

    setForm((p: any) => ({
      ...p,
      siteId,
      departmentId: site?.department?.id || "",
      departmentName: site?.department?.name || "",
    }));
  };

  const handleUpdate = async () => {
    if (!form.siteId || !form.chequeAmt) {
      toast({
        title: "Validation Error",
        description: "Site and Cheque Amount are required",
      });
      return;
    }

    const res = await fetch(`${BASE_URL}/api/vouchers/${voucherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voucherDate: date,
        ...form,
      }),
    });

    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to update voucher",
      });
      return;
    }

    toast({
      title: "Updated",
      description: "Voucher updated successfully",
    });

    router.back(); // ✅ GO BACK TO LIST
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading voucher…
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <Card className="p-6 shadow-sm border rounded-xl bg-card">
      <CardHeader>
        <CardTitle>Edit Voucher</CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">

        {/* TOP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Date */}
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
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Site */}
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

          {/* Department */}
          <div className="space-y-1">
            <Label>Department</Label>
            <Input
              readOnly
              value={form.departmentName}
              className="bg-muted cursor-not-allowed"
            />
          </div>
        </div>

        {/* AMOUNT GRID */}
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
            <div key={key} className="grid grid-cols-2 gap-3 items-center">
              <Label className="font-medium">{label}</Label>
              <Input
                type="number"
                value={form[key]}
                onChange={(e) =>
                  handleChange(key, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {/* ACTION */}
        <div className="flex gap-4 pt-6">
          <Button onClick={handleUpdate}>Update</Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
