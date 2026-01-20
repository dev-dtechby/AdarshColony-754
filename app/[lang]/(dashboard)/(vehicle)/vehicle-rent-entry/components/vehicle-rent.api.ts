const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
export const API = {
  sites: `${BASE_URL}/api/sites`,
  ledgers: `${BASE_URL}/api/ledgers`,
  vehicles: `${BASE_URL}/api/vehicle-rent/vehicles`,
  logs: `${BASE_URL}/api/vehicle-rent/logs`,
  agreement: (id: string) => `${BASE_URL}/api/vehicle-rent/vehicles/${id}/agreement`,
  ownerSummary: `${BASE_URL}/api/vehicle-rent/owner-summary`,
};

export const normalizeList = (json: any) => {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
};
