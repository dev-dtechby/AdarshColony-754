"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { LIST_API } from "./api";
import { Member, SortMode, ViewMode } from "./types";
import MemberToolbar from "./MemberToolbar";
import ImportExcelDialog from "./ImportExcelDialog";
import MemberTableBlockWise from "./MemberTableBlockWise";
import MemberTableAll from "./MemberTableAll";

type ListType = "ALL" | "RENTED";

function isRented(m: any) {
  const policeUrl = m?.policeVerificationUrl ?? m?.policeVerifyUrl ?? null;
  return (
    m?.residentType === "TENANT" ||
    !!String(m?.rentalName ?? "").trim() ||
    !!String(m?.rentalMobileNo ?? "").trim() ||
    !!String(m?.rentAgreementUrl ?? "").trim() ||
    !!String(policeUrl ?? "").trim()
  );
}

function searchText(m: any) {
  const policeUrl = m?.policeVerificationUrl ?? m?.policeVerifyUrl ?? null;
  return [
    m?.serialNo,
    m?.memberCode,
    m?.name,
    m?.fatherOrHusbandName,
    m?.mobileNo,
    m?.blockNo,
    m?.floor,
    m?.flatNo,
    m?.rentalName,
    m?.rentalMobileNo,
    m?.rentAgreementUrl ? "rentagreement" : "",
    policeUrl ? "policeverification" : "",
  ]
    .map((v) => (v === null || v === undefined ? "" : String(v)))
    .join(" ")
    .toLowerCase();
}

export default function MemberListPage() {
  const { toast } = useToast();

  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const [block, setBlock] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("blockFlat");
  const [view, setView] = useState<ViewMode>("block");

  // ✅ NEW: rented list state
  const [listType, setListType] = useState<ListType>("ALL");

  const [importOpen, setImportOpen] = useState(false);

  // ✅ stable block dropdown options (never shrink)
  const [blockOptions, setBlockOptions] = useState<number[]>([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      // ✅ IMPORTANT: q server ko send नहीं कर रहे (global search client-side)
      const url =
        `${LIST_API}?block=${encodeURIComponent(block)}` +
        `&sort=${encodeURIComponent(sort)}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Failed to load members");
      }

      const rows = Array.isArray(json?.data) ? json.data : [];

      // ✅ alias safety: backend policeVerifyUrl दे तो UI में policeVerificationUrl भी बन जाए
      const mapped = rows.map((r: any) => ({
        ...r,
        policeVerificationUrl: r.policeVerificationUrl ?? r.policeVerifyUrl ?? null,
      }));

      setData(mapped);

      // ✅ update block options (never shrink)
      setBlockOptions((prev) => {
        const next = new Set(prev);
        mapped.forEach((m: any) => next.add(Number(m.blockNo)));
        return Array.from(next).sort((a, b) => a - b);
      });
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

  // ✅ Block list from stable options (not shrink)
  const allBlocks = useMemo(() => {
    if (blockOptions.length) return blockOptions;
    const set = new Set<number>();
    data.forEach((m: any) => set.add(Number(m.blockNo)));
    return Array.from(set).sort((a, b) => a - b);
  }, [blockOptions, data]);

  // ✅ baseList (client-side safety)
  const baseList = useMemo(() => {
    if (block === "ALL") return data;
    const b = Number(block);
    return (data as any[]).filter((m) => Number(m.blockNo) === b);
  }, [data, block]);

  // ✅ rented filter
  const rentedFiltered = useMemo(() => {
    if (listType === "RENTED") return (baseList as any[]).filter(isRented);
    return baseList;
  }, [baseList, listType]);

  // ✅ global search all columns
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rentedFiltered;
    return (rentedFiltered as any[]).filter((m) => searchText(m).includes(term));
  }, [rentedFiltered, q]);

  const grouped = useMemo(() => {
    const map = new Map<number, Member[]>();

    for (const m of filtered as any[]) {
      const blk = Number(m.blockNo);
      if (!map.has(blk)) map.set(blk, []);
      map.get(blk)!.push(m);
    }

    for (const [blk, arr] of map.entries()) {
      arr.sort((a: any, b: any) => {
        if (sort === "name") return String(a.name ?? "").localeCompare(String(b.name ?? ""));
        return Number(a.flatNo ?? 0) - Number(b.flatNo ?? 0);
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
        listType={listType}
        setListType={setListType}
        q={q}
        setQ={setQ}
        loading={loading}
        onSearch={fetchList}
        onOpenImport={() => setImportOpen(true)}
        exportRows={filtered as any}   // ✅ IMPORTANT
      />

      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} onImported={fetchList} />

      {view === "block" ? (
        <MemberTableBlockWise grouped={grouped as any} sort={sort} />
      ) : (
        <MemberTableAll rows={filtered as any} />
      )}
    </div>
  );
}