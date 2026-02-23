"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Member = {
  id: string;
  serialNo: number;
  memberCode: string;
  name: string;
  fatherOrHusbandName?: string | null;
  mobileNo?: string | null;
  blockNo: number;
  floor?: string | null;
  flatNo: number;
};

export default function AllMemberList() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [block, setBlock] = useState<"ALL" | string>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"blockFlat" | "name">("blockFlat");
  const [view, setView] = useState<"block" | "all">("block"); // block-wise vs flat list

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/colony-members?block=${block}&q=${encodeURIComponent(q)}&sort=${sort}`);
      const json = await res.json();
      setData(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, sort]);

  const blocks = useMemo(() => {
    const set = new Set<number>();
    data.forEach((m) => set.add(m.blockNo));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((m) => {
      return (
        m.name.toLowerCase().includes(term) ||
        (m.fatherOrHusbandName ?? "").toLowerCase().includes(term) ||
        (m.mobileNo ?? "").includes(term) ||
        m.memberCode.toLowerCase().includes(term)
      );
    });
  }, [data, q]);

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
          <div className="font-semibold text-lg">All Member List</div>

          <div className="ml-auto flex flex-wrap gap-2">
            <select
              className="h-10 px-3 border rounded-md"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
            >
              <option value="ALL">All Blocks</option>
              {blocks.map((b) => (
                <option key={b} value={String(b)}>
                  Block {b}
                </option>
              ))}
            </select>

            <select
              className="h-10 px-3 border rounded-md"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="blockFlat">Sort: Block/Flat</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            <select
              className="h-10 px-3 border rounded-md"
              value={view}
              onChange={(e) => setView(e.target.value as any)}
            >
              <option value="block">View: Block-wise</option>
              <option value="all">View: All List</option>
            </select>

            <Input
              className="w-72"
              placeholder="Search name / mobile / code..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <Button onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>

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
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left p-2">S.No</th>
                      <th className="text-left p-2">Member Code</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Father/Husband</th>
                      <th className="text-left p-2">Mobile</th>
                      <th className="text-left p-2">Floor</th>
                      <th className="text-left p-2">Flat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={m.id} className="border-b">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{m.memberCode}</td>
                        <td className="p-2 font-medium">{m.name}</td>
                        <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                        <td className="p-2">{m.mobileNo ?? "-"}</td>
                        <td className="p-2">{m.floor ?? "-"}</td>
                        <td className="p-2">{m.flatNo}</td>
                      </tr>
                    ))}
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
            <table className="min-w-[900px] w-full text-sm">
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">{m.memberCode}</td>
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2">{m.fatherOrHusbandName ?? "-"}</td>
                    <td className="p-2">{m.mobileNo ?? "-"}</td>
                    <td className="p-2">{m.blockNo}</td>
                    <td className="p-2">{m.floor ?? "-"}</td>
                    <td className="p-2">{m.flatNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}