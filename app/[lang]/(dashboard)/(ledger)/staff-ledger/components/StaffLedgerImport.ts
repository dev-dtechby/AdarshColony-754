import * as XLSX from "xlsx";

type ImportRow = {
  date: Date;
  siteName: string;
  expenseTitle: string;
  summary: string;
  remark: string;
  inAmount: number | null;
  outAmount: number | null;
};

type ImportResult = {
  successCount: number;
  failCount: number;
  errors: { row: number; message: string }[];
};

const REQUIRED_HEADERS = ["Date", "Site", "Expense", "Summary", "Remark", "In", "Out"] as const;

/* ================= HELPERS ================= */
const normalizeHeader = (h: any) => String(h ?? "").trim();

const normalizeSiteKey = (s: string) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " "); // collapse spaces

const toUtcNoonDate = (d: Date) => {
  // date-only safe (timezone shift avoid)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
};

const parseStringDate = (val: string): Date | null => {
  const s = (val || "").trim();
  if (!s) return null;

  // Try native first
  const native = new Date(s);
  if (!isNaN(native.getTime())) return toUtcNoonDate(native);

  // Try dd/mm/yyyy or dd-mm-yyyy
  const parts = s.split(/[-/]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  let dd = Number(parts[0]);
  let mm = Number(parts[1]);
  let yy = Number(parts[2]);

  // if yyyy-mm-dd
  if (parts[0].length === 4) {
    yy = Number(parts[0]);
    mm = Number(parts[1]);
    dd = Number(parts[2]);
  }

  if (!dd || !mm || !yy) return null;
  const d = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  if (isNaN(d.getTime())) return null;
  return d;
};

const excelNumberToDate = (n: number): Date | null => {
  try {
    const parsed = XLSX.SSF.parse_date_code(n);
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 12, 0, 0));
  } catch {
    return null;
  }
};

const parseAmount = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return isNaN(v) ? null : v;

  const s = String(v).replace(/₹/g, "").replace(/,/g, "").trim();
  if (!s) return null;

  const num = Number(s);
  if (isNaN(num)) return null;
  return num;
};

const readExcelRows = async (
  file: File
): Promise<{ rows: ImportRow[]; errors: { row: number; message: string }[] }> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    return { rows: [], errors: [{ row: 0, message: "Sheet not found" }] };
  }

  const raw = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  }) as any[][];

  if (!raw.length) {
    return { rows: [], errors: [{ row: 0, message: "Excel is empty" }] };
  }

  const headerRow = (raw[0] || []).map(normalizeHeader);

  // Strict header validation (exact order & names for first 7 columns)
  const expected = [...REQUIRED_HEADERS];
  const same =
    headerRow.length >= expected.length &&
    expected.every((h, idx) => headerRow[idx] === h);

  if (!same) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `Invalid header. Required first row columns exactly: ${expected.join(", ")}`,
        },
      ],
    };
  }

  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] || [];
    const excelRowNo = i + 1;

    // skip fully blank row
    const isBlank = r.every((c: any) => String(c ?? "").trim() === "");
    if (isBlank) continue;

    const dateVal = r[0];
    const siteVal = r[1];
    const expenseVal = r[2];
    const summaryVal = r[3];
    const remarkVal = r[4];
    const inVal = r[5];
    const outVal = r[6];

    // Date
    let date: Date | null = null;
    if (dateVal instanceof Date) date = toUtcNoonDate(dateVal);
    else if (typeof dateVal === "number") date = excelNumberToDate(dateVal);
    else if (typeof dateVal === "string") date = parseStringDate(dateVal);

    if (!date) {
      errors.push({ row: excelRowNo, message: "Invalid Date" });
      continue;
    }

    const expenseTitle = String(expenseVal ?? "").trim();
    if (!expenseTitle) {
      errors.push({ row: excelRowNo, message: "Expense is required" });
      continue;
    }

    const inAmount = parseAmount(inVal);
    const outAmount = parseAmount(outVal);

    const hasIn = inAmount !== null && inAmount !== undefined && inAmount !== 0;
    const hasOut = outAmount !== null && outAmount !== undefined && outAmount !== 0;

    if (hasIn && hasOut) {
      errors.push({ row: excelRowNo, message: "Only one of In or Out allowed (not both)" });
      continue;
    }
    if (!hasIn && !hasOut) {
      errors.push({ row: excelRowNo, message: "Either In or Out amount is required" });
      continue;
    }
    if (inAmount !== null && inAmount <= 0) {
      errors.push({ row: excelRowNo, message: "In must be > 0" });
      continue;
    }
    if (outAmount !== null && outAmount <= 0) {
      errors.push({ row: excelRowNo, message: "Out must be > 0" });
      continue;
    }

    rows.push({
      date,
      siteName: String(siteVal ?? "").trim(),
      expenseTitle,
      summary: String(summaryVal ?? "").trim(),
      remark: String(remarkVal ?? "").trim(),
      inAmount: inAmount ?? null,
      outAmount: outAmount ?? null,
    });
  }

  return { rows, errors };
};

export const importStaffLedgerExcel = async (params: {
  file: File;
  staffLedgerId: string;
  baseUrl: string;
  credentials?: RequestCredentials;
  onProgress?: (done: number, total: number) => void;
}): Promise<ImportResult> => {
  const { file, staffLedgerId } = params;

  const safeBaseUrl = (params.baseUrl || "").replace(/\/$/, "");
  const creds = params.credentials ?? "include";
  const onProgress = params.onProgress;

  const { rows, errors: parseErrors } = await readExcelRows(file);

  // 🔥 if parsing already failed or no rows
  const result: ImportResult = {
    successCount: 0,
    failCount: 0,
    errors: [...parseErrors],
  };

  if (!rows.length) {
    // parsing errors already in result.errors
    return result;
  }

  // Load sites for SiteName -> siteId mapping
  let siteMap = new Map<string, string>(); // key = normalized siteName
  try {
    const res = await fetch(`${safeBaseUrl}/api/sites`, { credentials: creds });
    const json = await res.json();
    const sites: { id: string; siteName: string }[] = json?.data ?? [];
    siteMap = new Map(sites.map((s) => [normalizeSiteKey(s.siteName), s.id]));
  } catch {
    // keep empty; non-blank siteName rows will fail with clear message
  }

  const total = rows.length;
  let done = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const excelRowNo = idx + 2; // header = 1

    try {
      const siteNameRaw = r.siteName || "";
      const siteKey = normalizeSiteKey(siteNameRaw);

      let siteId: string | null = null;

      if (siteKey) {
        siteId = siteMap.get(siteKey) || null;

        // extra tolerant: try without multiple spaces difference already handled
        if (!siteId) {
          result.failCount++;
          result.errors.push({
            row: excelRowNo,
            message: `Site not found: "${siteNameRaw}" (must match Sites master name)`,
          });
          done++;
          onProgress?.(done, total);
          continue;
        }
      }

      const payload: any = {
        staffLedgerId,
        siteId: siteId || undefined,
        expenseDate: r.date.toISOString(),
        expenseTitle: r.expenseTitle,
        summary: r.summary || undefined,
        remark: r.remark || undefined,
      };

      // ✅ IMPORTANT: use !== null (not truthy)
      if (r.inAmount !== null) payload.inAmount = r.inAmount;
      if (r.outAmount !== null) payload.outAmount = r.outAmount;

      const res = await fetch(`${safeBaseUrl}/api/staff-expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: creds,
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.message ||
            `Import failed (HTTP ${res.status})`
        );
      }

      result.successCount++;
    } catch (e: any) {
      result.failCount++;
      result.errors.push({
        row: excelRowNo,
        message: e?.message || "Import failed",
      });
    } finally {
      done++;
      onProgress?.(done, total);
    }
  }

  return result;
};
