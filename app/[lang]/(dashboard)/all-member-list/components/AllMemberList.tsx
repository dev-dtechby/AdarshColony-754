"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExportMemberList from "./ExportMemberList";

type Member = {
  id: string;

  serialNo?: number | null;
  memberCode?: string | null;

  name: string;
  fatherOrHusbandName?: string | null;
  mobileNo?: string | null;

  blockNo: number;
  floor?: string | null;
  flatNo: number;

  // rental / tenant docs
  rentalName?: string | null;
  rentalMobileNo?: string | null;
  rentAgreementUrl?: string | null;

  // backend may send either key
  policeVerificationUrl?: string | null;
  policeVerifyUrl?: string | null;

  // optional
  residentType?: "OWNER" | "TENANT" | null;
};

function safeStr(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

function getPoliceUrl(m: Member) {
  return (m.policeVerificationUrl ?? (m as any).policeVerifyUrl ?? null) as string | null;
}

function isRented(m: Member) {
  const policeUrl = getPoliceUrl(m);
  return (
    m.residentType === "TENANT" ||
    !!(m.rentalName?.trim()) ||
    !!(m.rentalMobileNo?.trim()) ||
    !!(m.rentAgreementUrl?.trim()) ||
    !!(policeUrl?.trim())
  );
}

function memberSearchText(m: Member) {
  const policeUrl = getPoliceUrl(m);
  const parts = [
    m.serialNo,
    m.memberCode,
    m.name,
    m.fatherOrHusbandName,
    m.mobileNo,
    m.blockNo,
    m.floor,
    m.flatNo,
    m.rentalName,
    m.rentalMobileNo,
    m.rentAgreementUrl ? "rentagreement" : "",
    policeUrl ? "policeverification" : "",
  ];
  return parts.map(safeStr).join(" ").toLowerCase();
}

async function downloadFromUrl(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    const obj = URL.createObjectURL(blob);
    a.href = obj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(obj);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function AllMemberList() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [block, setBlock] = useState<"ALL" | string>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"blockFlat" | "name">("blockFlat");
  const [view, setView] = useState<"block" | "all">("block");

  const [listType, setListType] = useState<"ALL" | "RENTED">("ALL");

  // ✅ stable block options (functional update fix)
  const [blockOptions, setBlockOptions] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    try {
      // NOTE: q is NOT sent to server, global search is client-side
      const res = await fetch(`/api/colony-members?block=${block}&sort=${sort}`);
      const json = await res.json();
      const rows: Member[] = json?.data ?? [];

      // ✅ normalize police url alias for UI
      const mapped = rows.map((r: any) => ({
        ...r,
        policeVerificationUrl: r.policeVerificationUrl ?? r.policeVerifyUrl ?? null,
      }));

      setData(mapped);

      // ✅ FIX: functional state update to avoid stale closure bug
      setBlockOptions((prev) => {
        const next = new Set(prev);
        mapped.forEach((m) => next.add(Number(m.blockNo)));
        return Array.from(next).sort((a, b) => a - b);
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, sort]);

  const blocks = useMemo(() => {
    if (blockOptions.length) return blockOptions;
    const set = new Set<number>();
    data.forEach((m) => set.add(Number(m.blockNo)));
    return Array.from(set).sort((a, b) => a - b);
  }, [blockOptions, data]);

  const baseList = useMemo(() => {
    if (block === "ALL") return data;
    const b = Number(block);
    return data.filter((m) => Number(m.blockNo) === b);
  }, [data, block]);

  // ✅ rented filter (works)
  const listFiltered = useMemo(() => {
    return listType === "RENTED" ? baseList.filter(isRented) : baseList;
  }, [baseList, listType]);

  // ✅ global search all columns
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return listFiltered;
    return listFiltered.filter((m) => memberSearchText(m).includes(term));
  }, [listFiltered, q]);

  const grouped = useMemo(() => {
    const map = new Map<number, Member[]>();
    for (const m of filtered) {
      if (!map.has(m.blockNo)) map.set(m.blockNo, []);
      map.get(m.blockNo)!.push(m);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        return a.flatNo - b.flatNo;
      });
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered, sort]);

  async function importExcel(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("/api/colony-members/import", { method: "POST", body: fd });
      const json = await res.json();
      await load();
      alert(`Import Done\nCreated: ${json.created}\nUpdated: ${json.updated}\nSkipped: ${json.skipped}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="font-semibold text-lg">
            {listType === "RENTED" ? "Rented Member List" : "All Member List"}
          </div>

          <div className="ml-auto flex flex-wrap gap-2 items-center">
            <select className="h-10 px-3 border rounded-md" value={block} onChange={(e) => setBlock(e.target.value)}>
              <option value="ALL">All Blocks</option>
              {blocks.map((b) => (
                <option key={b} value={String(b)}>
                  Block {b}
                </option>
              ))}
            </select>

            <select className="h-10 px-3 border rounded-md" value={listType} onChange={(e) => setListType(e.target.value as any)}>
              <option value="ALL">List: All Members</option>
              <option value="RENTED">List: Rented Only</option>
            </select>

            <select className="h-10 px-3 border rounded-md" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="blockFlat">Sort: Block/Flat</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            <select className="h-10 px-3 border rounded-md" value={view} onChange={(e) => setView(e.target.value as any)}>
              <option value="block">View: Block-wise</option>
              <option value="all">View: All List</option>
            </select>

            <Input
              className="w-72"
              placeholder="Global search (name/mobile/code/block/flat/tenant/docs...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />

            <Button onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>

            <ExportMemberList
              rows={filtered}
              disabled={loading}
              fileNamePrefix={listType === "RENTED" ? "RentedMembers" : "AllMembers"}
            />

            <label className="inline-flex items-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importExcel(f);
                }}
              />
              <Button type="button" variant="outline" disabled={loading}>
                Import Excel
              </Button>
            </label>
          </div>
        </div>

        <div className="mt-2 text-sm opacity-70">
          Showing: <b>{filtered.length}</b> / Total Loaded: <b>{data.length}</b>
        </div>
      </Card>

      {view === "block" ? (
        <div className="space-y-4">
          {grouped.map(([blk, members]) => (
            <Card key={blk} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Block {blk}</div>
                <div className="text-sm opacity-70">Total: {members.length}</div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="min-w-[1300px] w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left p-2">S.No</th>
                      <th className="text-left p-2">Member Code</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Father/Husband</th>
                      <th className="text-left p-2">Mobile</th>
                      <th className="text-left p-2">Floor</th>
                      <th className="text-left p-2">Flat</th>
                      <th className="text-left p-2">Tenant Name</th>
                      <th className="text-left p-2">Tenant Mobile</th>
                      <th className="text-left p-2">Rent Agreement</th>
                      <th className="text-left p-2">Police Verification</th>
                    </tr>
                  </thead>

                  <tbody>
                    {members.map((m, idx) => {
                      const policeUrl = getPoliceUrl(m);
                      return (
                        <tr key={m.id} className="border-b">
                          <td className="p-2">{idx + 1}</td>
                          <td className="p-2">{m.memberCode ?? "-"}</td>
                          <td className="p-2 font-medium">{m.name}</td>
                          <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                          <td className="p-2">{m.mobileNo ?? "-"}</td>
                          <td className="p-2">{m.floor ?? "-"}</td>
                          <td className="p-2">{m.flatNo}</td>

                          <td className="p-2">{m.rentalName ?? "-"}</td>
                          <td className="p-2">{m.rentalMobileNo ?? "-"}</td>

                          <td className="p-2">
                            {m.rentAgreementUrl ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8"
                                onClick={() => downloadFromUrl(m.rentAgreementUrl!, `RentAgreement-${m.memberCode ?? m.id}.pdf`)}
                              >
                                Download
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="p-2">
                            {policeUrl ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8"
                                onClick={() => downloadFromUrl(policeUrl, `PoliceVerification-${m.memberCode ?? m.id}.pdf`)}
                              >
                                Download
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-4">
          <div className="mb-3 text-sm opacity-70">Total: {filtered.length}</div>

          <div style={{ overflowX: "auto" }}>
            <table className="min-w-[1400px] w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Member Code</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Father/Husband</th>
                  <th className="text-left p-2">Mobile</th>
                  <th className="text-left p-2">Block</th>
                  <th className="text-left p-2">Floor</th>
                  <th className="text-left p-2">Flat</th>
                  <th className="text-left p-2">Tenant Name</th>
                  <th className="text-left p-2">Tenant Mobile</th>
                  <th className="text-left p-2">Rent Agreement</th>
                  <th className="text-left p-2">Police Verification</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((m, idx) => {
                  const policeUrl = getPoliceUrl(m);
                  return (
                    <tr key={m.id} className="border-b">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{m.memberCode ?? "-"}</td>
                      <td className="p-2 font-medium">{m.name}</td>
                      <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                      <td className="p-2">{m.mobileNo ?? "-"}</td>
                      <td className="p-2">{m.blockNo}</td>
                      <td className="p-2">{m.floor ?? "-"}</td>
                      <td className="p-2">{m.flatNo}</td>

                      <td className="p-2">{m.rentalName ?? "-"}</td>
                      <td className="p-2">{m.rentalMobileNo ?? "-"}</td>

                      <td className="p-2">
                        {m.rentAgreementUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8"
                            onClick={() => downloadFromUrl(m.rentAgreementUrl!, `RentAgreement-${m.memberCode ?? m.id}.pdf`)}
                          >
                            Download
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-2">
                        {policeUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8"
                            onClick={() => downloadFromUrl(policeUrl, `PoliceVerification-${m.memberCode ?? m.id}.pdf`)}
                          >
                            Download
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}