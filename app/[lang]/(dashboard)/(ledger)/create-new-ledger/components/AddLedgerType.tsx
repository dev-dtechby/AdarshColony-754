"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */
interface LedgerType {
  id: string;
  name: string;
}

/* ================= PROPS ================= */
interface Props {
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const API = `${BASE_URL}/api/ledger-types`;

export default function AddLedgerType({
  open,
  onClose,
  onChanged,
}: Props) {
  const [name, setName] = useState("");
  const [list, setList] = useState<LedgerType[]>([]);
  const [loading, setLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LedgerType | null>(null);

  const { toast } = useToast();

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await fetch(API, { credentials: "include" });
      const json = await res.json();
      setList(json?.data ?? []);
    } catch {
      toast({
        title: "❌ Error",
        description: "Failed to load ledger types",
      });
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  /* ================= ADD ================= */
  const add = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Ledger Type Added",
        description: name,
      });

      setName("");
      load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Add failed",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`${API}/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      toast({
        title: "🗑️ Ledger Type Deleted",
        description: "Moved to Deleted Records",
      });

      setDeleteOpen(false);
      setSelected(null);
      load();
      onChanged?.();
    } catch {
      toast({
        title: "❌ Error",
        description: "Delete failed",
      });
    }
  };

  /* ================= UI ================= */
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ledger Type Master</DialogTitle>
            <DialogDescription>
              Add or remove ledger types used across ERP.
            </DialogDescription>
          </DialogHeader>

          <Card className="p-5 space-y-4">
            {/* ADD */}
            <div className="flex gap-3">
              <Input
                placeholder="Ledger Type Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={add} disabled={loading}>
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>

            {/* LIST */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Ledger Type</th>
                    <th className="p-2 text-center w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No ledger types added yet
                      </td>
                    </tr>
                  )}

                  {list.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2">{l.name}</td>
                      <td className="p-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(l);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ledger Type?</DialogTitle>
            <DialogDescription>
              This ledger type will be removed from active list and moved to
              <b> Deleted Records</b>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="soft" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
