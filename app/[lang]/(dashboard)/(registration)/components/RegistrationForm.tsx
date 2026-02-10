"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import FamilyMembersDynamic, { FamilyMember } from "./FamilyMembersDynamic";
import VehiclesDynamic, { VehicleRow } from "./VehiclesDynamic";
import TermsBox from "./TermsBox";

type ResidentType = "OWNER" | "TENANT";
type Gender = "MALE" | "FEMALE" | "OTHER";

type EmergencyContact = {
  nameFamilyMember: string;
  mobile1: string;
  nameFriend: string;
  mobile2: string;
};

const TERMS_HINDI = `प्रत्येक रहवासी/किरायेदार इस बात का पूरा ध्यान रखें कि कॉलोनी में निवास करने के लिए कॉलोनी द्वारा जारी किया गया मेम्बर रजिस्ट्रेशन फॉर्म को पूरी सटीक जानकारी के साथ जमा करना अनिवार्य है।
और जमा करने के समय ही कॉलोनी के नियमों के बारे में अच्छी तरह से जानकारी एवं प्रबंधक से मॉडल उप-कानूनों की एक प्रति प्राप्त करें। कॉलोनी की विस्तृत बाय-लॉ नियमावली की जानकारी रखना हर एक फ्लैट मालिक/किरायेदार रहवासी के लिए अनिवार्य है। किसी भी विवाद की स्थिति में नियमों की जानकारी न होने की बात कहना मान्य नहीं होगा।
आदर्श कॉलोनी का फ्लैट मालिक/किरायेदार अपने मेंटेनेंस की राशि प्रति माह 15 तारीख तक अनिवार्य रूप से जमा करें।
आदर्श कॉलोनी परिसर में सभी संसाधनों और सुविधाओं का अनुचित उपयोग, तोड़-फोड़ या किसी प्रकार का अनुचित विवाद होने की स्थिति में उचित वैधानिक कार्यवाही का अधिकार कॉलोनी संचालक द्वारा नियमानुसार लिया जाएगा।`;

function clamp5<T>(arr: T[]) {
  return arr.slice(0, 5);
}

export default function RegistrationForm() {
  const { toast } = useToast();

  // ================== API ==================
  const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const REG_API = `${BASE_URL}/api/registration`;

  // ================== BASIC ==================
  const [date, setDate] = useState("");
  const [headFirstName, setHeadFirstName] = useState("");
  const [headLastName, setHeadLastName] = useState("");

  const [residentType, setResidentType] = useState<ResidentType | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [blockNo, setBlockNo] = useState("");
  const [flatNo, setFlatNo] = useState("");

  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");

  const [mobileNo, setMobileNo] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");
  const [totalMembers, setTotalMembers] = useState("");

  // ================== PHOTO ==================
  const [photo, setPhoto] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // ================== FAMILY MEMBERS ==================
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([{ name: "" }]);

  // ================== EMERGENCY ==================
  const [emergency, setEmergency] = useState<EmergencyContact>({
    nameFamilyMember: "",
    mobile1: "",
    nameFriend: "",
    mobile2: "",
  });

  // ================== VEHICLES (dynamic rows) ==================
  const [twoWheelerCount, setTwoWheelerCount] = useState("");
  const [fourWheelerCount, setFourWheelerCount] = useState("");

  const [twoWheelers, setTwoWheelers] = useState<VehicleRow[]>([{ vehicleNo: "", type: "" }]);
  const [fourWheelers, setFourWheelers] = useState<VehicleRow[]>([{ vehicleNo: "", type: "" }]);

  // ================== TERMS ==================
  const [agree, setAgree] = useState(false);

  // ================== UX ==================
  const [loading, setLoading] = useState(false);

  const fullHeadName = useMemo(() => {
    const fn = (headFirstName || "").trim();
    const ln = (headLastName || "").trim();
    return [fn, ln].filter(Boolean).join(" ");
  }, [headFirstName, headLastName]);

  const resetForm = () => {
    setDate("");
    setHeadFirstName("");
    setHeadLastName("");
    setResidentType("");
    setGender("");
    setBlockNo("");
    setFlatNo("");
    setDob("");
    setBloodGroup("");
    setEmail("");
    setProfession("");
    setMobileNo("");
    setWhatsappNo("");
    setTotalMembers("");

    setPhoto(null);
    if (photoRef.current) photoRef.current.value = "";

    setFamilyMembers([{ name: "" }]);
    setEmergency({ nameFamilyMember: "", mobile1: "", nameFriend: "", mobile2: "" });

    setTwoWheelerCount("");
    setFourWheelerCount("");
    setTwoWheelers([{ vehicleNo: "", type: "" }]);
    setFourWheelers([{ vehicleNo: "", type: "" }]);

    setAgree(false);
  };

  const validate = () => {
    if (!date) return "Date is required";
    if (!headFirstName.trim()) return "First Name is required";
    if (!residentType) return "Resident Type is required";
    if (!blockNo.trim()) return "Block No. is required";
    if (!flatNo.trim()) return "Flat No. is required";
    if (!gender) return "Gender is required";
    if (!mobileNo.trim()) return "Mobile No. is required";
    if (!agree) return "Please accept Terms & Conditions";
    return "";
  };

  const buildFormData = () => {
    const fd = new FormData();

    fd.append("date", date);
    fd.append("headFirstName", headFirstName);
    fd.append("headLastName", headLastName);
    fd.append("headName", fullHeadName);

    fd.append("residentType", residentType);
    fd.append("gender", gender);
    fd.append("blockNo", blockNo);
    fd.append("flatNo", flatNo);

    fd.append("dob", dob);
    fd.append("bloodGroup", bloodGroup);

    fd.append("email", email);
    fd.append("profession", profession);

    fd.append("mobileNo", mobileNo);
    fd.append("whatsappNo", whatsappNo);
    fd.append("totalMembers", totalMembers);

    if (photo) fd.append("photo", photo);

    fd.append(
      "familyMembers",
      JSON.stringify(clamp5(familyMembers).map((x) => ({ name: (x.name || "").trim() })))
    );

    fd.append(
      "emergency",
      JSON.stringify({
        nameFamilyMember: (emergency.nameFamilyMember || "").trim(),
        mobile1: (emergency.mobile1 || "").trim(),
        nameFriend: (emergency.nameFriend || "").trim(),
        mobile2: (emergency.mobile2 || "").trim(),
      })
    );

    fd.append("twoWheelerCount", (twoWheelerCount || "").trim());
    fd.append("fourWheelerCount", (fourWheelerCount || "").trim());

    fd.append(
      "twoWheelers",
      JSON.stringify(clamp5(twoWheelers).map((v) => ({
        vehicleNo: (v.vehicleNo || "").trim(),
        type: (v.type || "").trim(),
      })))
    );

    fd.append(
      "fourWheelers",
      JSON.stringify(clamp5(fourWheelers).map((v) => ({
        vehicleNo: (v.vehicleNo || "").trim(),
        type: (v.type || "").trim(),
      })))
    );

    fd.append("agree", String(agree));

    return fd;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "❌ Validation Error", description: err });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(REG_API, {
        method: "POST",
        body: buildFormData(),
        credentials: "include",
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { message: text };
      }

      if (!res.ok) throw new Error(json?.message || `Registration failed (HTTP ${res.status})`);

      toast({
        title: "✅ Registration Submitted",
        description: json?.message || "Form submitted successfully.",
      });

      resetForm();
    } catch (e: any) {
      toast({ title: "❌ Error", description: e?.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold">Membership Registration Form</h2>
        <p className="text-sm text-muted-foreground">
          Adarsh Colony 754 — सभी fields भरें (Photo optional).
        </p>
      </div>

      {/* Date + Photo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label>Passport Size Photo</Label>
          <Input
            ref={photoRef}
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-muted-foreground">JPG/PNG (optional)</p>
        </div>
      </div>

      {/* Head of Family */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Head of the Family</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <Label>First Name</Label>
            <Input value={headFirstName} onChange={(e) => setHeadFirstName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Last Name</Label>
            <Input value={headLastName} onChange={(e) => setHeadLastName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Resident Type</Label>
            <select
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={residentType}
              onChange={(e) => setResidentType(e.target.value as ResidentType)}
            >
              <option value="">Select</option>
              <option value="OWNER">Owner</option>
              <option value="TENANT">Tenant (Rented)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-1">
            <Label>Block No.</Label>
            <Input value={blockNo} onChange={(e) => setBlockNo(e.target.value)} placeholder="Ex: 6" />
          </div>

          <div className="space-y-1">
            <Label>Flat No.</Label>
            <Input value={flatNo} onChange={(e) => setFlatNo(e.target.value)} placeholder="Ex: 12" />
          </div>

          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Blood Group</Label>
            <Input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="Ex: B+" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <Label>Gender</Label>
            <select
              className="w-full border rounded-md px-3 py-2 bg-background"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>Email Id</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@email.com"
            />
          </div>

          <div className="space-y-1">
            <Label>Profession</Label>
            <Input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Ex: Business / Service"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <Label>Mobile No.</Label>
            <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder="10 digit" />
          </div>

          <div className="space-y-1">
            <Label>Whatsapp No.</Label>
            <Input value={whatsappNo} onChange={(e) => setWhatsappNo(e.target.value)} placeholder="10 digit" />
          </div>

          <div className="space-y-1">
            <Label>Total members in family including you</Label>
            <Input value={totalMembers} onChange={(e) => setTotalMembers(e.target.value)} placeholder="Ex: 5" />
          </div>
        </div>
      </div>

      {/* Family Members (dynamic purchase-style) */}
      <FamilyMembersDynamic value={familyMembers} onChange={setFamilyMembers} max={5} />

      {/* Emergency */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Emergency Contact</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <Label>Name (Family Member)</Label>
            <Input
              value={emergency.nameFamilyMember}
              onChange={(e) => setEmergency((p) => ({ ...p, nameFamilyMember: e.target.value }))}
              placeholder="Name"
            />
          </div>

          <div className="space-y-1">
            <Label>Mobile No.</Label>
            <Input
              value={emergency.mobile1}
              onChange={(e) => setEmergency((p) => ({ ...p, mobile1: e.target.value }))}
              placeholder="10 digit"
            />
          </div>

          <div className="space-y-1">
            <Label>Name (Friend)</Label>
            <Input
              value={emergency.nameFriend}
              onChange={(e) => setEmergency((p) => ({ ...p, nameFriend: e.target.value }))}
              placeholder="Name"
            />
          </div>

          <div className="space-y-1">
            <Label>Mobile No.</Label>
            <Input
              value={emergency.mobile2}
              onChange={(e) => setEmergency((p) => ({ ...p, mobile2: e.target.value }))}
              placeholder="10 digit"
            />
          </div>
        </div>
      </div>

      {/* Vehicles (dynamic purchase-style) */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Vehicle’s Details</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <Label>Total Number of Two Wheeler</Label>
            <Input value={twoWheelerCount} onChange={(e) => setTwoWheelerCount(e.target.value)} placeholder="Ex: 2" />
          </div>

          <div className="space-y-1">
            <Label>Total Number of Four Wheeler</Label>
            <Input value={fourWheelerCount} onChange={(e) => setFourWheelerCount(e.target.value)} placeholder="Ex: 1" />
          </div>
        </div>

        <VehiclesDynamic
          twoWheelers={twoWheelers}
          setTwoWheelers={setTwoWheelers}
          fourWheelers={fourWheelers}
          setFourWheelers={setFourWheelers}
        />
      </div>

      {/* Terms */}
      <TermsBox terms={TERMS_HINDI} agree={agree} onAgreeChange={setAgree} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Registration"}
        </Button>

        <Button variant="outline" type="button" onClick={resetForm} disabled={loading}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
