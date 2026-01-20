"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Upload } from "lucide-react";
import type { Site } from "./labour-ledger.types";

// ✅ NEW: dropdown exports (shadcn)
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  disabled?: boolean;
  apiBase: string;
  contractorId: string;
  contractorName: string;
  sites: Site[];
  paymentRows: any[];
  onDone: () => Promise<void> | void;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const parseExcelDate = (v: unknown) => {
  // string "YYYY-MM-DD" / "DD/MM/YYYY" / Date object / Excel serial
  if (!v) return "";
  if (v instanceof Date) return toYMD(v);

  // Excel serial number
  const num = Number(v);
  if (Number.isFinite(num) && num > 20000) {
    const js = new Date(Math.round((num - 25569) * 86400 * 1000));
    return toYMD(js);
  }

  const s = String(v).trim();
  if (!s) return "";

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toYMD(d);

  // fallback: DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const dd = pad2(Number(m[1]));
    const mm = pad2(Number(m[2]));
    const yy = String(m[3]).length === 2 ? `20${m[3]}` : m[3];
    return `${yy}-${mm}-${dd}`;
  }

  return "";
};

export default function PaymentsImportExportTools({
  disabled,
  apiBase,
  contractorId,
  contractorName,
  sites,
  paymentRows,
  onDone,
}: Props) {
  const [openImport, setOpenImport] = useState(false);

  const siteNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sites) m.set(String(s.id), String((s as any).siteName ?? ""));
    return m;
  }, [sites]);

  const siteIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sites) m.set(String((s as any).siteName ?? "").toLowerCase(), String(s.id));
    return m;
  }, [sites]);

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const rows = (paymentRows || []).map((p: any) => ({
        PaymentId: p.id,
        PaymentDate: p.paymentDate ? toYMD(new Date(p.paymentDate)) : "",
        SiteId: p.siteId || p.site?.id || "",
        SiteName: p.site?.siteName || siteNameById.get(String(p.siteId)) || "",
        Mode: p.mode || "",
        RefNo: p.refNo || "",
        Through: p.through || "",
        Amount: Number(p.amount || 0),
        Remarks: p.remarks || "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
      XLSX.writeFile(wb, `LabourPayments_${contractorName || contractorId}.xlsx`);
    } catch (e: any) {
      alert(e?.message || "Excel export failed. Ensure 'xlsx' is installed.");
    }
  };

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default as any;

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(12);
      doc.text(`Labour Payments - ${contractorName || contractorId}`, 14, 12);

      const body = (paymentRows || []).map((p: any, idx: number) => [
        idx + 1,
        p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "",
        p.site?.siteName || siteNameById.get(String(p.siteId)) || "",
        p.mode || "",
        [p.refNo, p.through].filter(Boolean).join(" / "),
        Number(p.amount || 0),
      ]);

      autoTable(doc, {
        head: [["#", "Date", "Site", "Mode", "Ref/Through", "Amount"]],
        body,
        startY: 18,
      });

      doc.save(`LabourPayments_${contractorName || contractorId}.pdf`);
    } catch (e: any) {
      alert(e?.message || "PDF export failed. Ensure 'jspdf' & 'jspdf-autotable' are installed.");
    }
  };

  return (
    <>
      {/* ✅ SINGLE EXPORT BUTTON with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={!!disabled} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={exportExcel} disabled={!!disabled}>
            Export Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPDF} disabled={!!disabled}>
            Export PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import button unchanged */}
      <Button
        size="sm"
        variant="outline"
        disabled={!!disabled}
        onClick={() => setOpenImport(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" /> Import
      </Button>

      <ImportPaymentsDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        apiBase={apiBase}
        contractorId={contractorId}
        siteIdByName={siteIdByName}
        onDone={onDone}
      />
    </>
  );
}

function ImportPaymentsDialog({
  open,
  onClose,
  apiBase,
  contractorId,
  siteIdByName,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  contractorId: string;
  siteIdByName: Map<string, string>;
  onDone: () => Promise<void> | void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const parse = async () => {
    if (!file) return;
    try {
      setParsing(true);
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const mapped = json.map((r: any) => {
        const paymentDate = parseExcelDate(r.paymentDate ?? r.PaymentDate);
        const siteIdRaw = String(r.siteId ?? r.SiteId ?? "").trim();
        const siteNameRaw = String(r.siteName ?? r.SiteName ?? "").trim();

        let siteId = siteIdRaw;
        if (!siteId && siteNameRaw) {
          siteId = siteIdByName.get(siteNameRaw.toLowerCase()) || "";
        }

        const amount = Number(r.amount ?? r.Amount ?? 0);
        const mode = String(r.mode ?? r.Mode ?? "CASH").trim() || "CASH";

        return {
          paymentDate,
          siteId,
          amount,
          mode,
          refNo: String(r.refNo ?? r.RefNo ?? "").trim(),
          through: String(r.through ?? r.Through ?? "").trim(),
          remarks: String(r.remarks ?? r.Remarks ?? "").trim(),
        };
      });

      const cleaned = mapped.filter(
        (x: any) => x.paymentDate && x.siteId && Number.isFinite(x.amount) && x.amount > 0
      );

      setRows(cleaned);
    } catch (e: any) {
      alert(e?.message || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const doImport = async () => {
    if (!rows.length) return alert("No valid rows to import");
    try {
      setImporting(true);

      for (const r of rows) {
        const res = await fetch(`${apiBase}/payments`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractorId,
            siteId: r.siteId,
            paymentDate: r.paymentDate,
            amount: Number(r.amount),
            mode: r.mode,
            refNo: r.refNo || "",
            through: r.through || "",
            remarks: r.remarks || "",
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Import failed");
      }

      await onDone?.();
      onClose();
      setFile(null);
      setRows([]);
    } catch (e: any) {
      alert(e?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Payments (Excel)</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="text-sm text-muted-foreground">
            Excel columns allowed: PaymentDate, SiteId / SiteName, Amount, Mode, RefNo, Through, Remarks
          </div>

          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={parse} disabled={!file || parsing}>
              {parsing ? "Parsing..." : "Parse File"}
            </Button>
            <Button onClick={doImport} disabled={!rows.length || importing}>
              {importing ? "Importing..." : `Import ${rows.length} Rows`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Close
            </Button>
          </div>

          <div className="border rounded-md overflow-auto" style={{ maxHeight: 320 }}>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/60 border-b sticky top-0">
                <tr className="text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">SiteId</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Mode</th>
                  <th className="px-3 py-2 text-left">Ref/Through</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{r.paymentDate}</td>
                    <td className="px-3 py-2">{r.siteId}</td>
                    <td className="px-3 py-2 text-right">{Number(r.amount || 0)}</td>
                    <td className="px-3 py-2">{r.mode}</td>
                    <td className="px-3 py-2">
                      {[r.refNo, r.through].filter(Boolean).join(" / ") || "-"}
                    </td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                      No parsed rows yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
