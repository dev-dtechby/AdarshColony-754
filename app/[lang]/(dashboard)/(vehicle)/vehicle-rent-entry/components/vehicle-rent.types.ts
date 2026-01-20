export type Site = { id: string; siteName: string; isDeleted?: boolean };

export type Ledger = { id: string; name: string; ledgerType?: { name?: string | null } | null };

export type VehicleRentBasis = "HOURLY" | "MONTHLY";

export type VehicleRentVehicle = {
  id: string;
  ownerLedgerId: string;
  vehicleNo: string;
  vehicleName: string;
  rentBasis: VehicleRentBasis;
  hourlyRate?: string | null;
  monthlyRate?: string | null;
  agreementUrl?: string | null;
  createdAt?: string;
};

export type VehicleRentLog = {
  id: string;
  vehicleId: string;
  siteId: string;
  entryDate: string;

  startMeter: string;
  endMeter: string;
  workingHour: string;

  dieselExp: string;
  generatedAmt: string;
  paymentAmt: string;
  balanceAmt: string;

  remarks?: string | null;

  site?: { id: string; siteName: string };
  vehicle?: { id: string; vehicleNo: string; vehicleName: string };
};

export type OwnerSummaryResponse = {
  logs: VehicleRentLog[];
  totals: { generated: number; paid: number; diesel: number; balance: number };
};
