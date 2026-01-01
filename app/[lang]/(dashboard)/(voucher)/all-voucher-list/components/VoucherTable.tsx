"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Download } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

/* ========= EXPORT UTILS ========= */
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

/* ========= DELETE DIALOG ========= */
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

/* ================= CONFIG ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function VoucherTable() {
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [sites, setSites] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* DELETE STATES */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH ================= */
  const loadData = async () => {
    try {
      const [siteRes, voucherRes] = await Promise.all([
        fetch(`${BASE_URL}/api/sites`).then((r) => r.json()),
        fetch(`${BASE_URL}/api/vouchers`).then((r) => r.json()),
      ]);

      setSites(siteRes.data || []);
      setVouchers(voucherRes.data || []);
    } catch (err) {
      console.error("VOUCHER LOAD ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= FILTER ================= */
  const filteredData = useMemo(() => {
    return vouchers.filter((v) => {
      const t = search.toLowerCase();

      const matchesSearch =
        v.site?.siteName?.toLowerCase().includes(t) ||
        v.department?.name?.toLowerCase().includes(t) ||
        String(v.chequeAmt || "").includes(t) ||
        String(v.grossAmt || "").includes(t);

      const matchesSite = siteFilter ? v.siteId === siteFilter : true;

      return matchesSearch && matchesSite;
    });
  }, [search, siteFilter, vouchers]);

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      const res = await fetch(
        `${BASE_URL}/api/vouchers/${deleteId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast({
        title: "Deleted",
        description: "Voucher moved to deleted records",
      });

      setDeleteId(null);
      loadData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete voucher",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* ================= EXPORT ================= */
  const handleExportExcel = () =>
    exportToExcel(filteredData, "Voucher_List");

  const handleExportPDF = () =>
    exportToPDF(filteredData, "Voucher_List");

  if (loading) {
    return <div className="p-6">Loading vouchers…</div>;
  }

  return (
    <>
      <Card className="p-6 border rounded-md mt-4">

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search anything…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.siteName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 md:col-span-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-x-auto max-h-[65vh] border rounded-md">
          <table className="min-w-[1800px] text-sm border-collapse">
            <thead className="sticky top-0 bg-default-100 z-10">
              <tr>
                {[
                  "Voucher Date","Site","Department","Gross Amt","Withheld",
                  "Income Tax","Revenue","LWF","Royalty","Misc",
                  "Karmkar Tax","Secured Deposit","TDS on GST","TDS",
                  "Performance Guarantee","GST","Improper Finishing",
                  "Other Deduction","Deduction Amt","Cheque Amt","Action",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.map((v) => (
                <tr key={v.id} className="border-b hover:bg-default-50">
                  <td className="px-4 py-2">
                    {new Date(v.voucherDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{v.site?.siteName}</td>
                  <td className="px-4 py-2">{v.department?.name}</td>

                  <td className="px-4 py-2">{v.grossAmt}</td>
                  <td className="px-4 py-2">{v.withheld}</td>
                  <td className="px-4 py-2">{v.incomeTax}</td>
                  <td className="px-4 py-2">{v.revenue}</td>
                  <td className="px-4 py-2">{v.lwf}</td>
                  <td className="px-4 py-2">{v.royalty}</td>
                  <td className="px-4 py-2">{v.miscDeduction}</td>
                  <td className="px-4 py-2">{v.karmkarTax}</td>
                  <td className="px-4 py-2">{v.securedDeposit}</td>
                  <td className="px-4 py-2">{v.tdsOnGst}</td>
                  <td className="px-4 py-2">{v.tds}</td>
                  <td className="px-4 py-2">{v.performanceGuarantee}</td>
                  <td className="px-4 py-2">{v.gst}</td>
                  <td className="px-4 py-2">{v.improperFinishing}</td>
                  <td className="px-4 py-2">{v.otherDeduction}</td>
                  <td className="px-4 py-2 text-red-600 font-semibold">
                    {v.deductionAmt}
                  </td>
                  <td className="px-4 py-2 text-green-600 font-semibold">
                    {v.chequeAmt}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      <Eye className="w-5 h-5 cursor-pointer" />
                      <Pencil
                        className="w-5 h-5 cursor-pointer text-yellow-600"
                        onClick={() =>
                          router.push(`edit/${v.id}`)
                        }
                      />

                      <Trash2
                        className="w-5 h-5 text-red-600 cursor-pointer"
                        onClick={() => setDeleteId(v.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={21} className="text-center py-6 text-muted-foreground">
                    No vouchers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DELETE CONFIRM */}
      <DeleteConfirmDialog
        open={!!deleteId}
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Voucher?"
        description="This voucher will be soft-deleted and can be restored later."
      />
    </>
  );
}
