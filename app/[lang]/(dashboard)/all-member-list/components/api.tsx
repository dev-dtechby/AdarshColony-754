const raw =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "");

const API_BASE = raw.replace(/\/$/, "");

export const LIST_API = `${API_BASE}/api/colony-members`;
export const IMPORT_API = `${API_BASE}/api/colony-members/import`;