"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")
  ).replace(/\/$/, "");

const LIST_API = `${API_BASE}/api/colony-members`;

export type ColonyMemberLite = {
  id: string;
  name: string;
  mobileNo?: string | null;
  blockNo: number;
  flatNo: number;
  floor?: string | null;
  fatherOrHusbandName?: string | null;
  memberCode?: string | null;
  rentalName?: string | null;
  rentalMobileNo?: string | null;
};

export default function MemberPrefillPicker({
  onSelect,
  title = "Select Flat / Owner",
  helper = "Block / Name / Mobile से search करें और Use पर click करें.",
}: {
  onSelect: (m: ColonyMemberLite) => void;
  title?: string;
  helper?: string;
}) {
  const [q, setQ] = useState("");
  const [block, setBlock] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ColonyMemberLite[]>([]);
  const [open, setOpen] = useState(false);

  const debouncedQ = useMemo(() => q.trim(), [q]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const url =
        `${LIST_API}?block=${encodeURIComponent(block)}` +
        `&q=${encodeURIComponent(debouncedQ)}` +
        `&sort=name`;

      const res = await fetch(url, { cache: "no-store" });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        // HTML आया तो API_BASE गलत है
        setRows([]);
        return;
      }

      setRows(Array.isArray(json?.data) ? json.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(fetchMembers, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, block, open]);

  return (
    <Card className="p-4 space-y-3">
      <div className="font-semibold">{title}</div>
      <div className="text-xs opacity-70">{helper}</div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="h-10 px-3 border rounded-md bg-background"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
        >
          <option value="ALL">All Blocks</option>
          {Array.from({ length: 30 }).map((_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Block {i + 1}
            </option>
          ))}
        </select>

        <Input
          className="w-80"
          placeholder="Search by Name / Mobile / Reg No (AC754-....)"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        <Button type="button" variant="outline" onClick={() => { setOpen(true); fetchMembers(); }} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>

        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setRows([]); }}>
          Close
        </Button>
      </div>

      {open && (
        <div className="border rounded-md overflow-hidden">
          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead className="bg-background sticky top-0">
                <tr className="border-b">
                  <th className="text-left p-2">Reg</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Mobile</th>
                  <th className="text-left p-2">Block</th>
                  <th className="text-left p-2">Flat</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{m.memberCode ?? "-"}</td>
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2">{m.mobileNo ?? "-"}</td>
                    <td className="p-2">{m.blockNo}</td>
                    <td className="p-2">{m.flatNo}</td>
                    <td className="p-2">
                      <Button type="button" variant="outline" onClick={() => { onSelect(m); setOpen(false); }}>
                        Use
                      </Button>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td className="p-4 text-center opacity-70" colSpan={6}>
                      No match found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}