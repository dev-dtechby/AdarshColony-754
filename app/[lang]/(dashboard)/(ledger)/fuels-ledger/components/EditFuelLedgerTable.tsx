// D:\Projects\branao.in\clone\branao-Full-Kit\app\[lang]\(dashboard)\(ledger)\fuels-ledger\components\EditFuelLedgerTable.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

import type {
  Site,
  FuelStation,
  FuelLedgerRow,
  PurchaseType,
  FuelType,
} from "./fuel-ledger.types";

/* ================= TYPES (LOCAL ONLY) ================= */
type OwnerLedgerLite = {
  id: string;
  name: string;
  ledgerType?: { id?: string; name?: string | null } | null;
  isDeleted?: boolean;
};

type VehicleRentVehicleLite = {
  id: string;
  ownerLedgerId: string;
  vehicleNo: string;
  vehicleName: string;
  rentBasis?: string | null;
  hourlyRate?: any;
  monthlyRate?: any;
  agreementUrl?: string | null;
};

type EditableRow = {
  id: string;

  fuelStationId: string;
  siteId: string;

  entryDate: string; // yyyy-mm-dd

  slipNo: string;
  through: string;

  // ✅ stored in DB as OWN_VEHICLE / RENT_VEHICLE
  purchaseType: PurchaseType;

  // ✅ NEW: for RENT_VEHICLE (VEHICLE_OWNER ledger id)
  ownerLedgerId: string;

  vehicleNumber: string; // vehicleNo
  vehicleName: string;

  fuelType: FuelType;

  qty: string; // numeric string
  rate: string; // numeric string

  remarks: string;
};

/* ================= CONSTS ================= */
const LEDGER_API_PATH = "/api/fuel-station-ledger";
const LEDGERS_API_PATH = "/api/ledgers";
const VEHICLE_RENT_VEHICLES_API_PATH = "/api/vehicle-rent/vehicles";

/* ================= HELPERS ================= */
const cleanStr = (v: any) => String(v ?? "").trim();

const toInputDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toISO = (yyyyMMdd: string) => {
  const d = new Date(yyyyMMdd);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const num = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : NaN;
};

const normalizePurchaseType = (v: any): PurchaseType => {
  const s = cleanStr(v).toUpperCase();
  if (s === "OWN" || s === "OWN_VEHICLE") return "OWN_VEHICLE";
  if (s === "RENT" || s === "RENT_VEHICLE" || s === "RENTAL") return "RENT_VEHICLE";
  return "OWN_VEHICLE";
};

const normalizeFuelType = (v: any): FuelType => {
  const s = cleanStr(v);
  const allowed: FuelType[] = ["Diesel", "Petrol", "CNG", "LPG", "AdBlue", "Other"];
  return allowed.includes(s as FuelType) ? (s as FuelType) : "Diesel";
};

function normalizeList(json: any) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
}

const normalizeRow = (r: EditableRow) => ({
  fuelStationId: cleanStr(r.fuelStationId),
  siteId: cleanStr(r.siteId),
  entryDate: cleanStr(r.entryDate),

  slipNo: cleanStr(r.slipNo),
  through: cleanStr(r.through),

  purchaseType: cleanStr(r.purchaseType),

  ownerLedgerId: cleanStr(r.ownerLedgerId),

  vehicleNumber: cleanStr(r.vehicleNumber),
  vehicleName: cleanStr(r.vehicleName),

  fuelType: cleanStr(r.fuelType),

  qty: cleanStr(r.qty),
  rate: cleanStr(r.rate),

  remarks: cleanStr(r.remarks),
});

/* ================= COMPONENT ================= */
export default function EditFuelLedgerTable(props: {
  rows: FuelLedgerRow[];
  sites: Site[];
  fuelStations: FuelStation[];
  baseUrl: string;

  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const {
    rows = [],
    sites = [],
    fuelStations = [],
    baseUrl,
    onCancel,
    onSaved,
  } = props;

  const LEDGER_API = useMemo(() => `${baseUrl}${LEDGER_API_PATH}`, [baseUrl]);
  const LEDGERS_API = useMemo(() => `${baseUrl}${LEDGERS_API_PATH}`, [baseUrl]);
  const VEHICLES_API = useMemo(
    () => `${baseUrl}${VEHICLE_RENT_VEHICLES_API_PATH}`,
    [baseUrl]
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formRows, setFormRows] = useState<EditableRow[]>([]);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  // ✅ VEHICLE_OWNER ledgers (for PurchaseType column list)
  const [ownerLedgers, setOwnerLedgers] = useState<OwnerLedgerLite[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // ✅ vehicles by ownerLedgerId (for Vehicle Number dropdown)
  const [vehiclesByOwner, setVehiclesByOwner] = useState<Record<string, VehicleRentVehicleLite[]>>(
    {}
  );
  const [loadingVehicles, setLoadingVehicles] = useState<Record<string, boolean>>({});

  const originalMapRef = useRef<Record<string, EditableRow>>({});

  /* ================= LOAD VEHICLE OWNERS ================= */
  const loadVehicleOwners = async () => {
    try {
      setLoadingOwners(true);
      const res = await fetch(`${LEDGERS_API}?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      const list: OwnerLedgerLite[] = normalizeList(json);

      const filtered = list
        .filter((l) => {
          const t = String(l?.ledgerType?.name || "").trim().toUpperCase();
          const del = (l as any)?.isDeleted;
          return t === "VEHICLE_OWNER" && !del;
        })
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setOwnerLedgers(filtered);
    } catch (e) {
      console.error("❌ VEHICLE_OWNER ledgers load failed:", e);
      setOwnerLedgers([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  /* ================= LOAD VEHICLES FOR OWNER ================= */
  const loadVehiclesForOwner = async (ownerLedgerId: string) => {
    const oid = cleanStr(ownerLedgerId);
    if (!oid) return;

    // already cached
    if (vehiclesByOwner[oid]?.length) return;

    setLoadingVehicles((p) => ({ ...p, [oid]: true }));
    try {
      const qs = new URLSearchParams();
      qs.set("ownerLedgerId", oid);

      const res = await fetch(`${VEHICLES_API}?${qs.toString()}&_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      const list: VehicleRentVehicleLite[] = normalizeList(json);

      const sorted = (list || [])
        .map((v: any) => ({
          id: String(v.id),
          ownerLedgerId: String(v.ownerLedgerId),
          vehicleNo: String(v.vehicleNo || ""),
          vehicleName: String(v.vehicleName || ""),
        }))
        .filter((v) => v.vehicleNo)
        .sort((a, b) => a.vehicleNo.localeCompare(b.vehicleNo));

      setVehiclesByOwner((p) => ({ ...p, [oid]: sorted }));
    } catch (e) {
      console.error("❌ Vehicles load failed:", e);
      setVehiclesByOwner((p) => ({ ...p, [oid]: [] }));
    } finally {
      setLoadingVehicles((p) => ({ ...p, [oid]: false }));
    }
  };

  useEffect(() => {
    // load owner ledgers once (baseUrl available)
    loadVehicleOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  /* ================= INIT MAP FROM SELECTED ROWS ================= */
  useEffect(() => {
    setErrors({});

    const mapped: EditableRow[] = (rows ?? []).map((r: any) => {
      const pt = normalizePurchaseType(r.purchaseType);

      const ownerLedgerId = cleanStr(
        // ✅ preferred: new DB field
        r.ownerLedgerId ??
          // optional fallback (if someone stored as ownerLedgerId inside purchaseType string earlier)
          ""
      );

      return {
        id: r.id,

        fuelStationId: cleanStr(r.fuelStationId ?? r.ledgerId ?? r.fuelStation?.id ?? ""),
        siteId: cleanStr(r.siteId ?? r.site?.id ?? ""),

        entryDate: toInputDate(String(r.entryDate ?? "")),

        slipNo: cleanStr(r.slipNo),
        through: cleanStr(r.through),

        purchaseType: pt,

        ownerLedgerId: pt === "RENT_VEHICLE" ? ownerLedgerId : "",

        vehicleNumber: cleanStr(r.vehicleNumber),
        vehicleName: cleanStr(r.vehicleName),

        fuelType: normalizeFuelType(r.fuelType),

        qty: r.qty == null ? "" : String(r.qty),
        rate: r.rate == null ? "" : String(r.rate),

        remarks: cleanStr(r.remarks),
      };
    });

    setFormRows(mapped);
    setDirtyIds(new Set());

    const snap: Record<string, EditableRow> = {};
    mapped.forEach((m) => (snap[m.id] = m));
    originalMapRef.current = snap;

    // preload vehicles for rows which are RENT + have ownerLedgerId
    mapped.forEach((m) => {
      if (m.purchaseType === "RENT_VEHICLE" && m.ownerLedgerId) {
        loadVehiclesForOwner(m.ownerLedgerId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const markDirtyIfChanged = (rowId: string, nextRow: EditableRow) => {
    const original = originalMapRef.current[rowId];
    if (!original) return;

    const a = normalizeRow(original);
    const b = normalizeRow(nextRow);

    const changed =
      a.fuelStationId !== b.fuelStationId ||
      a.siteId !== b.siteId ||
      a.entryDate !== b.entryDate ||
      a.slipNo !== b.slipNo ||
      a.through !== b.through ||
      a.purchaseType !== b.purchaseType ||
      a.ownerLedgerId !== b.ownerLedgerId ||
      a.vehicleNumber !== b.vehicleNumber ||
      a.vehicleName !== b.vehicleName ||
      a.fuelType !== b.fuelType ||
      a.qty !== b.qty ||
      a.rate !== b.rate ||
      a.remarks !== b.remarks;

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

        const nextRow: EditableRow = { ...r, ...patch };

        // ✅ if purchaseType changed to OWN -> clear owner + vehicle fields
        if (patch.purchaseType === "OWN_VEHICLE") {
          nextRow.ownerLedgerId = "";
          // keep existing manual entry? (no feature change) -> keep as is, but safe to clear:
          // nextRow.vehicleNumber = "";
          // nextRow.vehicleName = "";
        }

        // ✅ if switched to RENT without owner -> clear owner vehicle fields
        if (patch.purchaseType === "RENT_VEHICLE" && !nextRow.ownerLedgerId) {
          // keep as is
        }

        markDirtyIfChanged(id, nextRow);
        return nextRow;
      })
    );
  };

  // ✅ PurchaseType column single-dropdown handler
  const setPurchaseTypeSelection = (rowId: string, val: string) => {
    // val = "OWN_VEHICLE" OR "RENT_OWNER:<ledgerId>"
    if (val === "OWN_VEHICLE") {
      updateRow(rowId, { purchaseType: "OWN_VEHICLE", ownerLedgerId: "" });
      return;
    }

    if (val.startsWith("RENT_OWNER:")) {
      const ownerLedgerId = val.replace("RENT_OWNER:", "").trim();

      // when selecting a new owner, clear vehicle selection (so user picks correct vehicle)
      updateRow(rowId, {
        purchaseType: "RENT_VEHICLE",
        ownerLedgerId,
        vehicleNumber: "",
        vehicleName: "",
      });

      loadVehiclesForOwner(ownerLedgerId);
      return;
    }
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

    // preload vehicles again for restored rows
    Object.values(snap).forEach((m) => {
      if (m.purchaseType === "RENT_VEHICLE" && m.ownerLedgerId) {
        loadVehiclesForOwner(m.ownerLedgerId);
      }
    });
  };

  const validateOnly = (rowsToValidate: EditableRow[]) => {
    const nextErr: Record<string, string> = {};

    for (const r of rowsToValidate) {
      if (!cleanStr(r.fuelStationId)) nextErr[r.id] = "Fuel Station required";
      else if (!cleanStr(r.siteId)) nextErr[r.id] = "Site required";
      else if (!cleanStr(r.entryDate)) nextErr[r.id] = "Date required";
      else if (!cleanStr(r.slipNo)) nextErr[r.id] = "Slip/Receipt No required";
      else if (!cleanStr(r.through)) nextErr[r.id] = "Through required";
      else if (r.purchaseType === "RENT_VEHICLE" && !cleanStr(r.ownerLedgerId))
        nextErr[r.id] = "Vehicle Owner required";
      else if (!cleanStr(r.vehicleNumber)) nextErr[r.id] = "Vehicle Number required";
      else if (!cleanStr(r.vehicleName)) nextErr[r.id] = "Vehicle required";
      else if (!cleanStr(r.fuelType)) nextErr[r.id] = "Fuel Type required";
      else {
        const q = num(r.qty);
        const rt = num(r.rate);
        if (!Number.isFinite(q) || q <= 0) nextErr[r.id] = "Qty must be > 0";
        else if (!Number.isFinite(rt) || rt <= 0) nextErr[r.id] = "Rate must be > 0";
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
          const iso = toISO(r.entryDate);
          if (!iso) throw new Error(`Invalid date for id ${r.id}`);

          const q = num(r.qty);
          const rt = num(r.rate);
          const amount = Number.isFinite(q) && Number.isFinite(rt) ? q * rt : null;

          const payload: any = {
            // ✅ accept both names (service/model uses ledgerId; UI uses fuelStationId)
            fuelStationId: cleanStr(r.fuelStationId),
            ledgerId: cleanStr(r.fuelStationId),

            siteId: cleanStr(r.siteId),
            entryDate: iso,

            slipNo: cleanStr(r.slipNo),
            through: cleanStr(r.through),

            purchaseType: r.purchaseType, // OWN_VEHICLE / RENT_VEHICLE

            // ✅ NEW
            ownerLedgerId: r.purchaseType === "RENT_VEHICLE" ? cleanStr(r.ownerLedgerId) : null,

            vehicleNumber: cleanStr(r.vehicleNumber),
            vehicleName: cleanStr(r.vehicleName),

            fuelType: r.fuelType,

            qty: q,
            rate: rt,
            amount,

            remarks: cleanStr(r.remarks) ? cleanStr(r.remarks) : null,
          };

          const res = await fetch(`${LEDGER_API}/${r.id}`, {
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
      await onSaved?.();
    } catch (e: any) {
      alert(e?.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const editedCount = dirtyIds.size;

  // helper for purchase type select value
  const purchaseSelectValue = (r: EditableRow) => {
    if (r.purchaseType === "OWN_VEHICLE") return "OWN_VEHICLE";
    if (r.purchaseType === "RENT_VEHICLE" && r.ownerLedgerId) return `RENT_OWNER:${r.ownerLedgerId}`;
    return "RENT_OWNER:"; // placeholder
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* TOP BAR */}
      <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-6 pb-3 border-b bg-background/60 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            Bulk Edit Fuel Ledger ({formRows.length})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">
            Header freeze रहेगा, sirf rows scroll होंगी. Update = sirf edited rows.
          </div>

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

              <span className="text-[11px] text-muted-foreground ml-2">
                Owners: {loadingOwners ? "Loading..." : ownerLedgers.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ONLY THIS AREA SCROLLS */}
      <div className="flex-1 min-h-0 p-3 md:p-4">
        <div className="h-full min-h-0 rounded-xl border bg-card/40 overflow-hidden flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-auto"
            style={{
              scrollbarGutter: "stable",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 2400 }}>
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur border-b">
                      <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-3 text-center w-10"></th>
                        <th className="px-3 py-3 text-left w-56">Fuel Station</th>
                        <th className="px-3 py-3 text-left w-56">Site</th>
                        <th className="px-3 py-3 text-left w-44">Date</th>
                        <th className="px-3 py-3 text-left w-44">Slip/Receipt No</th>
                        <th className="px-3 py-3 text-left w-56">Through</th>

                        {/* ✅ Purchase type now contains Vehicle Owner list when Rent */}
                        <th className="px-3 py-3 text-left w-72">Purchase Type / Owner</th>

                        <th className="px-3 py-3 text-left w-52">Vehicle Number</th>
                        <th className="px-3 py-3 text-left w-52">Vehicle</th>

                        <th className="px-3 py-3 text-left w-36">Fuel Type</th>
                        <th className="px-3 py-3 text-right w-28">Qty</th>
                        <th className="px-3 py-3 text-right w-28">Rate</th>
                        <th className="px-3 py-3 text-right w-32">Amount</th>
                        <th className="px-3 py-3 text-left w-64">Remark</th>
                        <th className="px-3 py-3 text-left w-56">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {formRows.map((r) => {
                        const isDirty = dirtyIds.has(r.id);
                        const q = num(r.qty);
                        const rt = num(r.rate);
                        const amt = Number.isFinite(q) && Number.isFinite(rt) ? q * rt : null;

                        const isRent = r.purchaseType === "RENT_VEHICLE";
                        const ownerVehicles = r.ownerLedgerId ? vehiclesByOwner[r.ownerLedgerId] || [] : [];
                        const isLoadingVeh = r.ownerLedgerId ? !!loadingVehicles[r.ownerLedgerId] : false;

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
                                className="border bg-background px-2 py-2 rounded-md text-sm w-56"
                                value={r.fuelStationId}
                                onChange={(e) => updateRow(r.id, { fuelStationId: e.target.value })}
                                disabled={saving}
                              >
                                <option value="">Select Fuel Station</option>
                                {(fuelStations ?? []).map((fs) => (
                                  <option key={fs.id} value={fs.id}>
                                    {fs.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-56"
                                value={r.siteId}
                                onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                                disabled={saving}
                              >
                                <option value="">Select Site</option>
                                {(sites ?? []).map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.siteName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                type="date"
                                value={r.entryDate}
                                onChange={(e) => updateRow(r.id, { entryDate: e.target.value })}
                                disabled={saving}
                                className="w-44"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.slipNo}
                                onChange={(e) => updateRow(r.id, { slipNo: e.target.value })}
                                disabled={saving}
                                className="w-44"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.through}
                                onChange={(e) => updateRow(r.id, { through: e.target.value })}
                                disabled={saving}
                                className="w-56"
                              />
                            </td>

                            {/* ✅ PurchaseType single select with owner list inside */}
                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-72"
                                value={purchaseSelectValue(r)}
                                onChange={(e) => setPurchaseTypeSelection(r.id, e.target.value)}
                                disabled={saving || loadingOwners}
                                title="Select Own Vehicle OR Rent - Owner"
                              >
                                <option value="OWN_VEHICLE">Own Vehicle</option>

                                <option value="RENT_OWNER:" disabled>
                                  {loadingOwners ? "Loading owners..." : "Rent Vehicle - Select Owner"}
                                </option>

                                {(ownerLedgers ?? []).map((o) => (
                                  <option key={o.id} value={`RENT_OWNER:${o.id}`}>
                                    Rent - {o.name}
                                  </option>
                                ))}
                              </select>

                              {isRent && !r.ownerLedgerId ? (
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  Owner select करें
                                </div>
                              ) : null}
                            </td>

                            {/* ✅ Vehicle Number: for RENT -> dropdown from VehicleRentVehicle by ownerLedgerId */}
                            <td className="px-3 py-3">
                              {isRent ? (
                                <select
                                  className="border bg-background px-2 py-2 rounded-md text-sm w-52"
                                  value={r.vehicleNumber}
                                  onChange={(e) => {
                                    const vno = e.target.value;
                                    const found = ownerVehicles.find((v) => v.vehicleNo === vno);
                                    updateRow(r.id, {
                                      vehicleNumber: vno,
                                      vehicleName: found?.vehicleName || "",
                                    });
                                  }}
                                  disabled={saving || !r.ownerLedgerId || isLoadingVeh}
                                >
                                  <option value="">
                                    {!r.ownerLedgerId
                                      ? "Select owner first"
                                      : isLoadingVeh
                                      ? "Loading vehicles..."
                                      : "Select Vehicle No"}
                                  </option>
                                  {ownerVehicles.map((v) => (
                                    <option key={v.id} value={v.vehicleNo}>
                                      {v.vehicleNo} {v.vehicleName ? `- ${v.vehicleName}` : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  value={r.vehicleNumber}
                                  onChange={(e) => updateRow(r.id, { vehicleNumber: e.target.value })}
                                  disabled={saving}
                                  className="w-52"
                                />
                              )}
                            </td>

                            {/* Vehicle Name: auto-filled for RENT (still editable if you want) */}
                            <td className="px-3 py-3">
                              <Input
                                value={r.vehicleName}
                                onChange={(e) => updateRow(r.id, { vehicleName: e.target.value })}
                                disabled={saving}
                                className="w-52"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <select
                                className="border bg-background px-2 py-2 rounded-md text-sm w-36"
                                value={r.fuelType}
                                onChange={(e) => updateRow(r.id, { fuelType: e.target.value as FuelType })}
                                disabled={saving}
                              >
                                <option value="Diesel">Diesel</option>
                                <option value="Petrol">Petrol</option>
                                <option value="CNG">CNG</option>
                                <option value="LPG">LPG</option>
                                <option value="AdBlue">AdBlue</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={r.qty}
                                onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                                disabled={saving}
                                className="w-28 text-right"
                                inputMode="decimal"
                              />
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={r.rate}
                                onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                                disabled={saving}
                                className="w-28 text-right"
                                inputMode="decimal"
                              />
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Input
                                value={amt == null ? "" : amt.toFixed(2)}
                                readOnly
                                tabIndex={-1}
                                className="w-32 text-right"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <Input
                                value={r.remarks}
                                onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                                disabled={saving}
                                className="w-64"
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
                              <div className="text-[10px] text-muted-foreground mt-1">ID: {r.id}</div>
                            </td>
                          </tr>
                        );
                      })}

                      {formRows.length === 0 && (
                        <tr>
                          <td colSpan={15} className="p-6 text-center text-muted-foreground">
                            No rows selected
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden p-3 space-y-3">
              {formRows.map((r, idx) => {
                const isDirty = dirtyIds.has(r.id);
                const isRent = r.purchaseType === "RENT_VEHICLE";
                const ownerVehicles = r.ownerLedgerId ? vehiclesByOwner[r.ownerLedgerId] || [] : [];
                const isLoadingVeh = r.ownerLedgerId ? !!loadingVehicles[r.ownerLedgerId] : false;

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
                        <div className="text-[11px] text-muted-foreground mb-1">Fuel Station</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.fuelStationId}
                          onChange={(e) => updateRow(r.id, { fuelStationId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Fuel Station</option>
                          {(fuelStations ?? []).map((fs) => (
                            <option key={fs.id} value={fs.id}>
                              {fs.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Site</div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={r.siteId}
                          onChange={(e) => updateRow(r.id, { siteId: e.target.value })}
                          disabled={saving}
                        >
                          <option value="">Select Site</option>
                          {(sites ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.siteName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Date</div>
                          <Input
                            type="date"
                            value={r.entryDate}
                            onChange={(e) => updateRow(r.id, { entryDate: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Slip/Receipt</div>
                          <Input
                            value={r.slipNo}
                            onChange={(e) => updateRow(r.id, { slipNo: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">Through</div>
                        <Input
                          value={r.through}
                          onChange={(e) => updateRow(r.id, { through: e.target.value })}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <div className="text-[11px] text-muted-foreground mb-1">
                          Purchase Type / Owner
                        </div>
                        <select
                          className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                          value={purchaseSelectValue(r)}
                          onChange={(e) => setPurchaseTypeSelection(r.id, e.target.value)}
                          disabled={saving || loadingOwners}
                        >
                          <option value="OWN_VEHICLE">Own Vehicle</option>
                          <option value="RENT_OWNER:" disabled>
                            {loadingOwners ? "Loading owners..." : "Rent Vehicle - Select Owner"}
                          </option>
                          {(ownerLedgers ?? []).map((o) => (
                            <option key={o.id} value={`RENT_OWNER:${o.id}`}>
                              Rent - {o.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Vehicle Number</div>

                          {isRent ? (
                            <select
                              className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                              value={r.vehicleNumber}
                              onChange={(e) => {
                                const vno = e.target.value;
                                const found = ownerVehicles.find((v) => v.vehicleNo === vno);
                                updateRow(r.id, {
                                  vehicleNumber: vno,
                                  vehicleName: found?.vehicleName || "",
                                });
                              }}
                              disabled={saving || !r.ownerLedgerId || isLoadingVeh}
                            >
                              <option value="">
                                {!r.ownerLedgerId
                                  ? "Select owner first"
                                  : isLoadingVeh
                                  ? "Loading vehicles..."
                                  : "Select Vehicle No"}
                              </option>
                              {ownerVehicles.map((v) => (
                                <option key={v.id} value={v.vehicleNo}>
                                  {v.vehicleNo} {v.vehicleName ? `- ${v.vehicleName}` : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              value={r.vehicleNumber}
                              onChange={(e) => updateRow(r.id, { vehicleNumber: e.target.value })}
                              disabled={saving}
                            />
                          )}
                        </div>

                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Vehicle</div>
                          <Input
                            value={r.vehicleName}
                            onChange={(e) => updateRow(r.id, { vehicleName: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Fuel Type</div>
                          <select
                            className="border bg-background px-2 py-2 rounded-md text-sm w-full"
                            value={r.fuelType}
                            onChange={(e) =>
                              updateRow(r.id, { fuelType: e.target.value as FuelType })
                            }
                            disabled={saving}
                          >
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="CNG">CNG</option>
                            <option value="LPG">LPG</option>
                            <option value="AdBlue">AdBlue</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Remark</div>
                          <Input
                            value={r.remarks}
                            onChange={(e) => updateRow(r.id, { remarks: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Qty</div>
                          <Input
                            value={r.qty}
                            onChange={(e) => updateRow(r.id, { qty: e.target.value })}
                            disabled={saving}
                            inputMode="decimal"
                          />
                        </div>
                        <div>
                          <div className="text-[11px] text-muted-foreground mb-1">Rate</div>
                          <Input
                            value={r.rate}
                            onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                            disabled={saving}
                            inputMode="decimal"
                          />
                        </div>
                      </div>

                      <div>
                        {errors[r.id] ? (
                          <span className="text-xs text-red-400">{errors[r.id]}</span>
                        ) : isDirty ? (
                          <span className="text-xs text-yellow-400">Edited</span>
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
