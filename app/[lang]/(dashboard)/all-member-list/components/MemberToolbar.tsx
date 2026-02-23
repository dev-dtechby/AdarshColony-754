"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortMode, ViewMode } from "./types";

export default function MemberToolbar({
  total,
  allBlocks,
  block,
  setBlock,
  sort,
  setSort,
  view,
  setView,
  q,
  setQ,
  loading,
  onSearch,
  onOpenImport,
}: {
  total: number;
  allBlocks: number[];
  block: string;
  setBlock: (v: string) => void;
  sort: SortMode;
  setSort: (v: SortMode) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  q: string;
  setQ: (v: string) => void;
  loading: boolean;
  onSearch: () => void;
  onOpenImport: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="font-semibold text-lg">All Member List</div>
        <div className="text-sm opacity-70">Total: {total}</div>

        <div className="ml-auto flex flex-wrap gap-2 items-center">
          <select
            className="h-10 px-3 border rounded-md bg-background"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
          >
            <option value="ALL">All Blocks</option>
            {allBlocks.map((b) => (
              <option key={b} value={String(b)}>
                Block {b}
              </option>
            ))}
          </select>

          <select
            className="h-10 px-3 border rounded-md bg-background"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
          >
            <option value="blockFlat">Sort: Block/Flat</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>

          <select
            className="h-10 px-3 border rounded-md bg-background"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
          >
            <option value="block">View: Block-wise</option>
            <option value="all">View: All List</option>
          </select>

          <Input
            className="w-72"
            placeholder="Search: name / mobile / reg no / block-flat"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />

          <Button onClick={onSearch} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>

          <Button type="button" variant="outline" onClick={onOpenImport} disabled={loading}>
            Import Excel
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs opacity-70">
        Excel Headers must be: <b>Name</b>, <b>Father / Husband Name</b>, <b>Mobile No</b>, <b>Block</b>, <b>Floor</b>,{" "}
        <b>Flat</b>
      </div>
    </Card>
  );
}