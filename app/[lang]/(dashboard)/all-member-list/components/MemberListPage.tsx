"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { LIST_API } from "./api";
import { Member, SortMode, ViewMode } from "./types";
import MemberToolbar from "./MemberToolbar";
import ImportExcelDialog from "./ImportExcelDialog";
import MemberTableBlockWise from "./MemberTableBlockWise";
import MemberTableAll from "./MemberTableAll";

export default function MemberListPage() {
  const { toast } = useToast();

  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [block, setBlock] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("blockFlat");
  const [view, setView] = useState<ViewMode>("block");

  const [importOpen, setImportOpen] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const url =
        `${LIST_API}?block=${encodeURIComponent(block)}` +
        `&q=${encodeURIComponent(q.trim())}` +
        `&sort=${encodeURIComponent(sort)}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Failed to load members");
      }

      setData(Array.isArray(json?.data) ? json.data : []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto fetch on block/sort change
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block, sort]);

  // Block list from current data
  const allBlocks = useMemo(() => {
    const set = new Set<number>();
    data.forEach((m) => set.add(m.blockNo));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  // Client side filter (for instant UI)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;

    return data.filter((m) => {
      return (
        (m.name ?? "").toLowerCase().includes(term) ||
        (m.fatherOrHusbandName ?? "").toLowerCase().includes(term) ||
        (m.mobileNo ?? "").includes(term) ||
        (m.memberCode ?? "").toLowerCase().includes(term) ||
        String(m.blockNo).includes(term) ||
        String(m.flatNo).includes(term)
      );
    });
  }, [data, q]);

  const grouped = useMemo(() => {
    const map = new Map<number, Member[]>();

    for (const m of filtered) {
      if (!map.has(m.blockNo)) map.set(m.blockNo, []);
      map.get(m.blockNo)!.push(m);
    }

    for (const [blk, arr] of map.entries()) {
      arr.sort((a, b) => {
        if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
        return (a.flatNo ?? 0) - (b.flatNo ?? 0);
      });
      map.set(blk, arr);
    }

    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered, sort]);

  return (
    <div className="space-y-4">
      <MemberToolbar
        total={filtered.length}
        allBlocks={allBlocks}
        block={block}
        setBlock={setBlock}
        sort={sort}
        setSort={setSort}
        view={view}
        setView={setView}
        q={q}
        setQ={setQ}
        loading={loading}
        onSearch={fetchList}
        onOpenImport={() => setImportOpen(true)}
      />

      <ImportExcelDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={fetchList}
      />

      {view === "block" ? (
        <MemberTableBlockWise grouped={grouped} sort={sort} />
      ) : (
        <MemberTableAll rows={filtered} />
      )}
    </div>
  );
}