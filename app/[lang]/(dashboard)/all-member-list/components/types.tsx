export type Member = {
  id: string;
  serialNo: number;
  memberCode: string; // AC754-0001-1-1
  name: string;
  fatherOrHusbandName?: string | null;
  mobileNo?: string | null;
  blockNo: number;
  floor?: string | null;
  flatNo: number;
  rentalName?: string | null;
  rentalMobileNo?: string | null;
};

export type SortMode = "blockFlat" | "name";
export type ViewMode = "block" | "all";