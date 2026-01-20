"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Pencil, Trash2, Edit3 } from "lucide-react";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

import {
  LabourContractor,
  Site,
  ContractorLedgerResponse,
} from "./labour-ledger.types";

import AddContractorDialog from "./AddContractorDialog";
import AddContractDialog from "./AddContractDialog";
import AddPaymentDialog from "./AddPaymentDialog";

// dialogs (existing)
import EditContractDialog from "./EditContractDialog";
import EditPaymentDialog from "./EditPaymentDialog";
import BulkEditContractsDialog from "./BulkEditContractsDialog";
import BulkEditPaymentsDialog from "./BulkEditPaymentsDialog";

// ✅ payments import/export tools
import PaymentsImportExportTools from "./PaymentsImportExportTools";

const clean = (v: any) => String(v ?? "").trim();
const ALL_SITES = "ALL";

export default function ContractorLedgerTable({ baseUrl }: { baseUrl: string }) {
  const API = useMemo(() => `${baseUrl}/api/labour-contractor-ledger`, [baseUrl]);
  const SITE_API = useMemo(() => `${baseUrl}/api/sites`, [baseUrl]);

  const [loading, setLoading] = useState(false);

  const [contractors, setContractors] = useState<LabourContractor[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [search, setSearch] = useState("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [siteFilterId, setSiteFilterId] = useState<string>(ALL_SITES); // ✅ default ALL

  const [ledger, setLedger] = useState<ContractorLedgerResponse | null>(null);

  const [openAddContractor, setOpenAddContractor] = useState(false);
  const [openAddContract, setOpenAddContract] = useState(false);
  const [openAddPayment, setOpenAddPayment] = useState(false);

  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  const [openEditContract, setOpenEditContract] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);

  const [openEditPayment, setOpenEditPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  const [openBulkContractEdit, setOpenBulkContractEdit] = useState(false);
  const [openBulkPaymentEdit, setOpenBulkPaymentEdit] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteKind, setDeleteKind] = useState<
    "CONTRACT_SINGLE" | "PAYMENT_SINGLE" | "CONTRACT_BULK" | "PAYMENT_BULK"
  >("CONTRACT_SINGLE");
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");

  const selectedContractor = useMemo(
    () => contractors.find((c) => c.id === selectedContractorId) || null,
    [contractors, selectedContractorId]
  );

  const siteIdSet = useMemo(() => new Set(sites.map((s) => String(s.id))), [sites]);

  const loadContractors = async () => {
    const res = await fetch(`${API}/contractors?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    setContractors(json?.data || []);
  };

  const loadSites = async () => {
    const res = await fetch(`${SITE_API}?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    setSites(json?.data || []);
  };

  /**
   * ✅ FIXED:
   * - All Sites => DO NOT send siteId
   * - Always add _ts properly using URLSearchParams (no "?&" / "&" bug)
   */
  const getLedgerUrl = () => {
    if (!selectedContractorId) return "";

    const isAllSites =
      !siteFilterId ||
      siteFilterId === ALL_SITES ||
      String(siteFilterId).toLowerCase().includes("all");

    const isValidSiteId = siteIdSet.has(String(siteFilterId));

    const params = new URLSearchParams();
    if (!isAllSites && isValidSiteId) {
      params.set("siteId", String(siteFilterId));
    }
    params.set("_ts", String(Date.now()));

    return `${API}/ledger/${selectedContractorId}?${params.toString()}`;
  };

  const loadLedger = async () => {
    if (!selectedContractorId) {
      setLedger(null);
      return;
    }
    try {
      setLoading(true);
      const url = getLedgerUrl();
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const json = await res.json().catch(() => null);
      setLedger(json?.data || null);

      setSelectedContractIds([]);
      setSelectedPaymentIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractors();
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractorId, siteFilterId, siteIdSet.size]);

  const filteredContractors = useMemo(() => {
    const q = search.toLowerCase();
    return contractors.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.mobile || "").includes(q)
    );
  }, [contractors, search]);

  const contractRows = (ledger?.contracts || []) as any[];
  const paymentRows = (ledger?.payments || []) as any[];

  /* ========================= Selection ========================= */
  const contractAllSelected =
    contractRows.length > 0 && selectedContractIds.length === contractRows.length;
  const paymentAllSelected =
    paymentRows.length > 0 && selectedPaymentIds.length === paymentRows.length;

  const toggleAllContracts = (checked: boolean) => {
    setSelectedContractIds(checked ? contractRows.map((r) => String(r.contractId)) : []);
  };

  const toggleAllPayments = (checked: boolean) => {
    setSelectedPaymentIds(checked ? paymentRows.map((r) => String(r.id)) : []);
  };

  const toggleContract = (id: string, checked: boolean) => {
    setSelectedContractIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  const togglePayment = (id: string, checked: boolean) => {
    setSelectedPaymentIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  /* ========================= Delete ========================= */
  const askDeleteContract = (contractId: string) => {
    setDeleteKind("CONTRACT_SINGLE");
    setDeleteTargetId(contractId);
    setConfirmDeleteOpen(true);
  };

  const askDeletePayment = (paymentId: string) => {
    setDeleteKind("PAYMENT_SINGLE");
    setDeleteTargetId(paymentId);
    setConfirmDeleteOpen(true);
  };

  const askBulkDeleteContracts = () => {
    if (!selectedContractIds.length) return;
    setDeleteKind("CONTRACT_BULK");
    setDeleteTargetId("");
    setConfirmDeleteOpen(true);
  };

  const askBulkDeletePayments = () => {
    if (!selectedPaymentIds.length) return;
    setDeleteKind("PAYMENT_BULK");
    setDeleteTargetId("");
    setConfirmDeleteOpen(true);
  };

  const doDelete = async () => {
    try {
      if (deleteKind === "CONTRACT_SINGLE") {
        const id = deleteTargetId;
        const res = await fetch(`${API}/contracts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Delete failed");
      }

      if (deleteKind === "PAYMENT_SINGLE") {
        const id = deleteTargetId;
        const res = await fetch(`${API}/payments/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Delete failed");
      }

      if (deleteKind === "CONTRACT_BULK") {
        await Promise.all(
          selectedContractIds.map(async (id) => {
            const res = await fetch(`${API}/contracts/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "Bulk delete failed");
          })
        );
      }

      if (deleteKind === "PAYMENT_BULK") {
        await Promise.all(
          selectedPaymentIds.map(async (id) => {
            const res = await fetch(`${API}/payments/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || "Bulk delete failed");
          })
        );
      }

      setConfirmDeleteOpen(false);
      setDeleteTargetId("");
      await loadLedger();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  /* ========================= Edit openers ========================= */
  const openContractEdit = (row: any) => {
    setEditingContract(row);
    setOpenEditContract(true);
  };

  const openPaymentEdit = (row: any) => {
    setEditingPayment(row);
    setOpenEditPayment(true);
  };

  // ✅ contractor change पर siteFilter को ALL कर दो ताकि हमेशा all-data आए
  const handleContractorChange = (id: string) => {
    setSelectedContractorId(id);
    setSiteFilterId(ALL_SITES);
  };

  return (
    <>
      <Card className="p-4 md:p-6 rounded-xl border shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Labour Contractor Ledger</div>
            <div className="text-xs text-muted-foreground">
              Site-wise deal amount + weekly payments + agreement upload
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => loadLedger()}
              disabled={loading || !selectedContractorId}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>

            <Button onClick={() => setOpenAddContractor(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contractor
            </Button>

            <Button
              variant="outline"
              disabled={!selectedContractorId}
              onClick={() => setOpenAddContract(true)}
            >
              Add Deal (Site Contract)
            </Button>

            <Button
              variant="outline"
              disabled={!selectedContractorId}
              onClick={() => setOpenAddPayment(true)}
            >
              Add Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Search Contractor</div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Mobile"
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Select Contractor</div>
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm w-full"
              value={selectedContractorId}
              onChange={(e) => handleContractorChange(e.target.value)}
            >
              <option value="">Select...</option>
              {filteredContractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Site Filter</div>
            <select
              className="border bg-background px-3 py-2 rounded-md text-sm w-full"
              value={siteFilterId}
              onChange={(e) => setSiteFilterId(e.target.value)}
              disabled={!selectedContractorId}
            >
              <option value={ALL_SITES}>All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Total Deal (Agreed)</div>
            <div className="text-xl font-semibold">₹ {ledger?.summary?.totalAgreed ?? 0}</div>
          </Card>

          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Total Paid</div>
            <div className="text-xl font-semibold">₹ {ledger?.summary?.totalPaid ?? 0}</div>
          </Card>

          <Card className="p-4 rounded-xl border">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-xl font-semibold">₹ {ledger?.summary?.totalBalance ?? 0}</div>
          </Card>
        </div>

        {/* Tables */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* ================= Contracts ================= */}
          <Card className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/40 flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm">Site Contracts (Deals)</div>
                <div className="text-xs text-muted-foreground">
                  Agreement link + site-wise amount
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedContractIds.length}
                  onClick={() => setOpenBulkContractEdit(true)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" /> Bulk Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedContractIds.length}
                  onClick={askBulkDeleteContracts}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Bulk Delete
                </Button>
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 920 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 w-10 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={contractAllSelected}
                          onChange={(e) => toggleAllContracts(e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-right">Agreed</th>
                      <th className="px-3 py-2 text-right">Paid</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                      <th className="px-3 py-2 text-left">Agreement</th>
                      <th className="px-3 py-2 text-left w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractRows.map((r) => {
                      const id = String(r.contractId);
                      const checked = selectedContractIds.includes(id);

                      return (
                        <tr key={id} className="border-t hover:bg-primary/5">
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={(e) => toggleContract(id, e.target.checked)}
                            />
                          </td>

                          <td className="px-3 py-2">{r.siteName}</td>
                          <td className="px-3 py-2 text-right">₹ {r.agreedAmount}</td>
                          <td className="px-3 py-2 text-right">₹ {r.paidAmount}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            ₹ {r.balanceAmount}
                          </td>

                          <td className="px-3 py-2">
                            {r.agreementUrl ? (
                              <a
                                href={r.agreementUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                {r.agreementName || "View"}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openContractEdit(r)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => askDeleteContract(id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {contractRows.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                          No contracts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* ================= Payments ================= */}
          <Card className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/40 flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm">Payments (Weekly)</div>
                <div className="text-xs text-muted-foreground">Payments are linked to Site</div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end items-center">
                {/* ✅ Import/Export tools (UI change will be done inside this component) */}
                <PaymentsImportExportTools
                  disabled={!selectedContractorId}
                  apiBase={API}
                  contractorId={selectedContractorId}
                  contractorName={selectedContractor?.name || ""}
                  sites={sites}
                  paymentRows={paymentRows}
                  onDone={async () => {
                    await loadLedger();
                  }}
                />

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedPaymentIds.length}
                  onClick={() => setOpenBulkPaymentEdit(true)}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" /> Bulk Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedPaymentIds.length}
                  onClick={askBulkDeletePayments}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Bulk Delete
                </Button>
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: 1040 }}>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/60 border-b">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 w-10 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={paymentAllSelected}
                          onChange={(e) => toggleAllPayments(e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Site</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-left">Ref/Through</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left w-28">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentRows.map((p) => {
                      const id = String(p.id);
                      const checked = selectedPaymentIds.includes(id);

                      return (
                        <tr key={id} className="border-t hover:bg-primary/5">
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={checked}
                              onChange={(e) => togglePayment(id, e.target.checked)}
                            />
                          </td>

                          <td className="px-3 py-2">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">{p.site?.siteName || "-"}</td>
                          <td className="px-3 py-2">{p.mode}</td>
                          <td className="px-3 py-2">
                            {[clean(p.refNo), clean(p.through)].filter(Boolean).join(" / ") ||
                              "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            ₹ {Number(p.amount || 0)}
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openPaymentEdit(p)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => askDeletePayment(id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paymentRows.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                          No payments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Dialogs */}
      <AddContractorDialog
        open={openAddContractor}
        onClose={() => setOpenAddContractor(false)}
        apiBase={API}
        onSaved={async () => {
          await loadContractors();
        }}
      />

      <AddContractDialog
        open={openAddContract}
        onClose={() => setOpenAddContract(false)}
        apiBase={API}
        sites={sites}
        contractorId={selectedContractorId}
        contractorName={selectedContractor?.name || ""}
        onSaved={async () => {
          await loadLedger();
        }}
      />

      <AddPaymentDialog
        open={openAddPayment}
        onClose={() => setOpenAddPayment(false)}
        apiBase={API}
        sites={sites}
        contractorId={selectedContractorId}
        contractorName={selectedContractor?.name || ""}
        onSaved={async () => {
          await loadLedger();
        }}
      />

      {/* Single edit dialogs */}
      <EditContractDialog
        open={openEditContract}
        onClose={() => setOpenEditContract(false)}
        apiBase={API}
        contractRow={editingContract}
        onSaved={async () => {
          await loadLedger();
        }}
      />

      <EditPaymentDialog
        open={openEditPayment}
        onClose={() => setOpenEditPayment(false)}
        apiBase={API}
        sites={sites}
        paymentRow={editingPayment}
        onSaved={async () => {
          await loadLedger();
        }}
      />

      {/* Bulk edit dialogs */}
      <BulkEditContractsDialog
        open={openBulkContractEdit}
        onClose={() => setOpenBulkContractEdit(false)}
        apiBase={API}
        contractRows={contractRows.filter((r) =>
          selectedContractIds.includes(String(r.contractId))
        )}
        onSaved={async () => {
          setSelectedContractIds([]);
          await loadLedger();
        }}
      />

      <BulkEditPaymentsDialog
        open={openBulkPaymentEdit}
        onClose={() => setOpenBulkPaymentEdit(false)}
        apiBase={API}
        sites={sites}
        paymentRows={paymentRows.filter((p) =>
          selectedPaymentIds.includes(String(p.id))
        )}
        onSaved={async () => {
          setSelectedPaymentIds([]);
          await loadLedger();
        }}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        title="Delete?"
        description="This will permanently delete the selected record(s)."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={doDelete}
        loading={false}
      />
    </>
  );
}
