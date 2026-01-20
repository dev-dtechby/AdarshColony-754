export type BranaoKpis = {
  inflow: number;
  outflow: number;
  profit: number;
  staffCount: number;
  supervisorCount: number;
  dieselQty: number;
  dieselAmount: number;
  vehicleRentAmount: number;
  labourAmount: number;
};

export type ProfitTrendRow = {
  date: string;
  inflow: number;
  outflow: number;
  profit: number;
};

export type CostBreakdownRow = {
  label: string;
  amount: number;
};

export type VehicleFuelRow = {
  vehicleNo: string;
  qty: number;
  amount: number;
  avgRate: number;
  entries: number;
};

export type FuelStationRow = {
  stationName: string;
  qty: number;
  amount: number;
};

export type ContractorRow = {
  contractorName: string;
  amount: number;
};

export type RecentTxnRow = {
  date: string;
  source: string;
  refNo?: string;
  party?: string;
  amount: number;
  remark?: string;
};
