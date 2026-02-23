"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import MemberPrefillPicker, { ColonyMemberLite } from "../../all-member-list/components/MemberPrefillPicker";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")
  ).replace(/\/$/, "");

const RENTAL_SAVE_API = `${API_BASE}/api/colony-members/rental`;
const RENTAL_CLEAR_API = `${API_BASE}/api/colony-members/rental-clear`;

export default function AddRentalPage() {
  const { toast } = useToast();

  const [selectedOwner, setSelectedOwner] = useState<ColonyMemberLite | null>(null);

  const [rentalName, setRentalName] = useState("");
  const [rentalMobileNo, setRentalMobileNo] = useState("");

  const [rentAgreement, setRentAgreement] = useState<File | null>(null);
  const [policeVerification, setPoliceVerification] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  const ownerLabel = useMemo(() => {
    if (!selectedOwner) return "";
    return `${selectedOwner.name} | Block ${selectedOwner.blockNo} Flat ${selectedOwner.flatNo} | ${selectedOwner.mobileNo ?? "-"}`;
  }, [selectedOwner]);

  const saveRental = async () => {
    if (!selectedOwner) {
      toast({ title: "Select Owner", description: "पहले owner/flat select करें", variant: "destructive" });
      return;
    }
    if (!rentalName.trim()) {
      toast({ title: "Tenant Name required", description: "Rental Name (tenant) डालें", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("blockNo", String(selectedOwner.blockNo));
      fd.append("flatNo", String(selectedOwner.flatNo));
      fd.append("rentalName", rentalName.trim());
      fd.append("rentalMobileNo", rentalMobileNo.trim());

      // ✅ files optional
      if (rentAgreement) fd.append("rentAgreement", rentAgreement);
      if (policeVerification) fd.append("policeVerification", policeVerification);

      const res = await fetch(RENTAL_SAVE_API, {
        method: "PUT",
        body: fd,
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { message: text };
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || "Failed to save rental");
      }

      toast({ title: "Saved", description: "Rental + Documents saved successfully" });

      setRentalName("");
      setRentalMobileNo("");
      setRentAgreement(null);
      setPoliceVerification(null);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const clearRental = async () => {
    if (!selectedOwner) return;

    setSaving(true);
    try {
      const res = await fetch(RENTAL_CLEAR_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockNo: selectedOwner.blockNo,
          flatNo: selectedOwner.flatNo,
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.message || "Failed to clear rental");

      toast({ title: "Cleared", description: "Rental + Documents removed" });

      setRentalName("");
      setRentalMobileNo("");
      setRentAgreement(null);
      setPoliceVerification(null);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <MemberPrefillPicker
        title="Select Owner/Flat (Auto Fill)"
        helper="Block/Name/Mobile से search करके flat select करें."
        onSelect={(m) => {
          setSelectedOwner(m);
          // optional: auto-fill existing tenant if picker includes it later
          toast({ title: "Owner Selected", description: `Selected: Block ${m.blockNo} Flat ${m.flatNo}` });
        }}
      />

      <Card className="p-4 space-y-4">
        <div className="font-semibold">Owner (Auto Filled)</div>
        <div className="text-sm opacity-80">{selectedOwner ? ownerLabel : "No owner selected"}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Rental (Tenant) Name</Label>
            <Input value={rentalName} onChange={(e) => setRentalName(e.target.value)} placeholder="Tenant name" />
          </div>

          <div className="space-y-1">
            <Label>Rental (Tenant) Mobile No.</Label>
            <Input value={rentalMobileNo} onChange={(e) => setRentalMobileNo(e.target.value)} placeholder="10 digit" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Rent Agreement (PDF/Image)</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setRentAgreement(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs opacity-70">{rentAgreement ? rentAgreement.name : "No file selected"}</div>
          </div>

          <div className="space-y-1">
            <Label>Police Verification (PDF/Image)</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setPoliceVerification(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs opacity-70">{policeVerification ? policeVerification.name : "No file selected"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={saveRental} disabled={saving || !selectedOwner}>
            {saving ? "Saving..." : "Save Rental"}
          </Button>

          <Button type="button" variant="ghost" onClick={clearRental} disabled={saving || !selectedOwner}>
            Clear Rental
          </Button>
        </div>
      </Card>
    </div>
  );
}