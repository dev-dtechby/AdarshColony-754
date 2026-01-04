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
interface Department {
  id: string;
  name: string;
}

/* ================= PROPS ================= */
interface Props {
  onChanged?: () => void;
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

const API = `${BASE_URL}/api/departments`;

export default function DepartmentMaster({ onChanged }: Props) {
  const [name, setName] = useState("");
  const [list, setList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Edit states
  const [editingId, setEditingId] = useState<string | null>(null);

  // delete dialog states
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);

  const { toast } = useToast();

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await fetch(API, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setList(json?.data ?? []);
    } catch {
      toast({
        title: "❌ Error",
        description: "Failed to load departments",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        title: "✅ Department Added",
        description: name,
      });

      setName("");
      await load();
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

  /* ================= START EDIT ================= */
  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setName(d.name);
  };

  /* ================= CANCEL EDIT ================= */
  const cancelEdit = () => {
    setEditingId(null);
    setName("");
  };

  /* ================= UPDATE ================= */
  const update = async () => {
    if (!editingId) return;
    if (!name.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message);

      toast({
        title: "✅ Department Updated",
        description: name,
      });

      cancelEdit();
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message || "Update failed",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= SOFT DELETE ================= */
  const confirmDelete = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`${API}/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error();

      toast({
        title: "🗑️ Department Deleted",
        description: "Moved to Deleted Records",
      });

      setOpen(false);
      setSelected(null);

      if (editingId === selected.id) cancelEdit();

      await load();
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
      <Card className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">Department Master</h2>

        {/* ADD / EDIT */}
        <div className="flex gap-3">
          <Input
            placeholder="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {!editingId ? (
            <Button onClick={add} disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          ) : (
            <>
              <Button onClick={update} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* LIST (✅ Scrollbar Added) */}
        <div className="border rounded-md overflow-hidden">
          {/* ✅ This wrapper creates vertical scrollbar when list is large */}
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-center w-[180px]">Action</th>
                </tr>
              </thead>

              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No departments added yet
                    </td>
                  </tr>
                )}

                {list.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.name}</td>
                    <td className="p-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(d)}
                          disabled={loading}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(d);
                            setOpen(true);
                          }}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department?</DialogTitle>
            <DialogDescription>
              This department will be removed from the active list and moved to
              <b> Deleted Records</b>.
              <br />
              <br />
              You can restore it later if required.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
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
