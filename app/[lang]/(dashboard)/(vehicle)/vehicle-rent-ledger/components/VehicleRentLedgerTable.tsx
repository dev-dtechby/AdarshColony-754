"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import { Plus, RefreshCcw, Pencil, Trash2, Upload, Filter, Search, FileText } from "lucide-react";

import VehicleRentEntryForm from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentEntryForm";
import VehicleRentLogDialog from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentLogDialog";
import VehicleRentAgreementDialog from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/VehicleRentAgreementDialog";
import { API, normalizeList } from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.api";

import type {
  Ledger,
  Site,
  VehicleRentLog,
  VehicleRentVehicle,
} from "@/app/[lang]/(dashboard)/(vehicle)/vehicle-rent-entry/components/vehicle-rent.types";

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

export default function VehicleRentLedgerTable({ baseUrl }: { baseUrl: string }) {
  // baseUrl currently not required because API uses NEXT_PUBLIC_API_BASE_URL; kept for consistency.

  const [sites, setSites] = useState<Site[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRentVehicle[]>([]);
  const [logs, setLogs] = useState<VehicleRentLog[]>([]);

  const [loading, setLoading] = useState(false);

  // Filters
  const [ownerLedgerId, setOwnerLedgerId] = useState("");
  const [siteId, setSiteId] = useState("ALL");
  const [vehicleId, setVehicleId] = useState("");

  const [q, setQ] = useState("");

  // Dialogs
  const [openCreateVehicle, setOpenCreateVehicle] = useState(false);
  const [openLog, setOpenLog] = useState(false);
  const [logMode, setLogMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingLog, setEditingLog] = useState<VehicleRentLog | null>(null);

  const [openAgreement, setOpenAgreement] = useState(false);
  const [agreementVehicleId, setAgreementVehicleId] = useState("");

  // Delete dialog
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSites = async () => {
    const res = await fetch(`${API.sites}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    const list = (normalizeList(json) as Site[]).filter((s) => !s.isDeleted);
    list.sort((a, b) => (a.siteName || "").localeCompare(b.siteName || ""));
    setSites(list);
  };

  const loadLedgers = async () => {
    const res = await fetch(`${API.ledgers}?_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    const list = normalizeList(json) as Ledger[];
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setLedgers(list);
  };

  const loadVehicles = async (ownerId?: string) => {
    const params = new URLSearchParams();
    if (ownerId) params.set("ownerLedgerId", ownerId);

    const res = await fetch(`${API.vehicles}?${params.toString()}&_ts=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));
    const list = normalizeList(json) as VehicleRentVehicle[];
    setVehicles(list);
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ownerLedgerId) params.set("ownerLedgerId", ownerLedgerId);

      // ✅ "ALL" means no filter
      if (siteId && siteId !== "ALL") params.set("siteId", siteId);

      if (vehicleId) params.set("vehicleId", vehicleId);

      const res = await fetch(`${API.logs}?${params.toString()}&_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      setLogs(normalizeList(json) as VehicleRentLog[]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadSites(), loadLedgers(), loadVehicles(ownerLedgerId || undefined)]);
    await loadLogs();
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVehicles(ownerLedgerId || undefined);
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerLedgerId, siteId, vehicleId]);

  const filteredLogs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter((r) => {
      const siteName = String(r.site?.siteName || "").toLowerCase();
      const vno = String(r.vehicle?.vehicleNo || "").toLowerCase();
      const vnm = String(r.vehicle?.vehicleName || "").toLowerCase();
      const rem = String(r.remarks || "").toLowerCase();
      return siteName.includes(s) || vno.includes(s) || vnm.includes(s) || rem.includes(s);
    });
  }, [logs, q]);

  const totals = useMemo(() => {
    return filteredLogs.reduce(
      (a, r) => {
        a.generated += n(r.generatedAmt);
        a.paid += n(r.paymentAmt);
        a.diesel += n(r.dieselExp);
        a.balance += n(r.balanceAmt);
        return a;
      },
      { generated: 0, paid: 0, diesel: 0, balance: 0 }
    );
  }, [filteredLogs]);

  const openCreateLog = () => {
    setLogMode("CREATE");
    setEditingLog(null);
    setOpenLog(true);
  };

  const openEditLog = (row: VehicleRentLog) => {
    setLogMode("EDIT");
    setEditingLog(row);
    setOpenLog(true);
  };

  const askDelete = (id: string) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`${API.logs}/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      setConfirmDelete(false);
      setDeleteId("");
      await loadLogs();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border rounded-xl overflow-hidden">
        <CardHeader className="border-b bg-background/60 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-semibold">Vehicle Rent Ledger</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Owner ledger → Multiple vehicles → Multiple sites (site-wise filter + all site view)
              </div>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              <Button variant="outline" onClick={refreshAll} className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>
              <Button onClick={() => setOpenCreateVehicle(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
              <Button onClick={openCreateLog} className="gap-2">
                <Plus className="h-4 w-4" /> Add Log
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" /> Owner Ledger
              </div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={ownerLedgerId}
                onChange={(e) => setOwnerLedgerId(e.target.value)}
              >
                <option value="">All Owners</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Site</div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="ALL">All Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Vehicle</div>
              <select
                className="border px-3 py-2 rounded-md bg-background w-full h-9 text-sm"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNo} — {v.vehicleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" /> Search
              </div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="site / vehicle / remark"
                className="h-9"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Generated Amt</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.generated.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Payment</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.paid.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Diesel Exp</div>
              <div className="text-base md:text-lg font-bold">₹ {totals.diesel.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded-lg border bg-background/30">
              <div className="text-[11px] text-muted-foreground">Balance</div>
              <div className={cn("text-base md:text-lg font-bold", totals.balance >= 0 ? "text-red-500" : "text-green-600")}>
                ₹ {totals.balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card/40 overflow-hidden">
            <div className="overflow-auto" style={{ maxHeight: "62vh" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 1300 }}>
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                      <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-left">Site</th>
                        <th className="px-2 py-2 text-left">Vehicle</th>
                        <th className="px-2 py-2 text-right">Start</th>
                        <th className="px-2 py-2 text-right">End</th>
                        <th className="px-2 py-2 text-right">Working Hr</th>
                        <th className="px-2 py-2 text-right">Diesel Exp</th>
                        <th className="px-2 py-2 text-right">Generated</th>
                        <th className="px-2 py-2 text-right">Payment</th>
                        <th className="px-2 py-2 text-right">Balance</th>
                        <th className="px-2 py-2 text-left">Remark</th>
                        <th className="px-2 py-2 text-left w-32">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.map((r) => (
                        <tr key={r.id} className="border-t hover:bg-primary/5">
                          <td className="px-2 py-2">{new Date(r.entryDate).toLocaleDateString()}</td>
                          <td className="px-2 py-2">{r.site?.siteName || "-"}</td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{r.vehicle?.vehicleNo || "-"}</div>
                            <div className="text-xs text-muted-foreground">{r.vehicle?.vehicleName || ""}</div>
                          </td>
                          <td className="px-2 py-2 text-right">{n(r.startMeter).toFixed(2)}</td>
                          <td className="px-2 py-2 text-right">{n(r.endMeter).toFixed(2)}</td>
                          <td className="px-2 py-2 text-right">{n(r.workingHour).toFixed(2)}</td>
                          <td className="px-2 py-2 text-right">₹ {n(r.dieselExp).toFixed(2)}</td>
                          <td className="px-2 py-2 text-right font-medium">₹ {n(r.generatedAmt).toFixed(2)}</td>
                          <td className="px-2 py-2 text-right">₹ {n(r.paymentAmt).toFixed(2)}</td>
                          <td className={cn("px-2 py-2 text-right font-medium", n(r.balanceAmt) > 0 ? "text-red-500" : "text-green-600")}>
                            ₹ {n(r.balanceAmt).toFixed(2)}
                          </td>
                          <td className="px-2 py-2">{r.remarks || ""}</td>
                          <td className="px-2 py-2">
                            <div className="flex gap-2">
                              <Button size="icon" variant="outline" onClick={() => openEditLog(r)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" onClick={() => askDelete(r.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {!filteredLogs.length ? (
                        <tr>
                          <td colSpan={12} className="p-6 text-center text-muted-foreground">
                            {loading ? "Loading..." : "No data"}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Per-vehicle agreement quick actions */}
          <div className="rounded-xl border p-3 bg-background/30">
            <div className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Vehicle Agreements
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {vehicles.slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-background">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {v.vehicleNo} — {v.vehicleName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {v.agreementUrl ? "Agreement uploaded" : "No agreement"}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {v.agreementUrl ? (
                      <a className="text-xs underline" href={v.agreementUrl as any} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : null}
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setAgreementVehicleId(v.id);
                        setOpenAgreement(true);
                      }}
                      title="Upload agreement"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {vehicles.length > 8 ? (
                <div className="text-xs text-muted-foreground p-2">
                  More vehicles available… filter owner to see specific list.
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Vehicle Dialog */}
      <VehicleRentEntryForm
        open={openCreateVehicle}
        onClose={() => setOpenCreateVehicle(false)}
        onCreated={async () => {
          await loadVehicles(ownerLedgerId || undefined);
        }}
      />

      {/* Log Dialog */}
      <VehicleRentLogDialog
        open={openLog}
        onClose={() => setOpenLog(false)}
        mode={logMode}
        sites={sites}
        vehicles={vehicles}
        initial={editingLog || undefined}
        onSaved={async () => {
          await loadLogs();
        }}
      />

      {/* Agreement Upload */}
      <VehicleRentAgreementDialog
        open={openAgreement}
        onClose={() => setOpenAgreement(false)}
        vehicleId={agreementVehicleId}
        onUploaded={async () => {
          await loadVehicles(ownerLedgerId || undefined);
        }}
      />

      {/* ✅ Delete Confirm (FIXED PROPS: onCancel) */}
      <DeleteConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        title="Delete Entry?"
        description="This will permanently delete the logbook entry."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={doDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
