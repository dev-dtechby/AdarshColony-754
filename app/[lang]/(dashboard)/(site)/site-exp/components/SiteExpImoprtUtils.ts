import * as XLSX from "xlsx";

type ImportRow = {
  siteName: string;
  date: Date;
  expenseTitle: string;
  expenseSummary: string;
  paymentDetails: string;
  amount: number;
};

type ImportResult = {
  successCount: number;
  failCount: number;
  errors: { row: number; message: string }[];
};

const normalize = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, ""); // remove dots (Exp. Summary -> Exp Summary)

const toUtcNoonDate = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));

const parseStringDate = (val: string): Date | null => {
  const s = (val || "").trim();
  if (!s) return null;

  // try native first (yyyy-mm-dd works)
  const native = new Date(s);
  if (!isNaN(native.getTime())) return toUtcNoonDate(native);

  // dd/mm/yyyy or dd-mm-yyyy OR yyyy/mm/dd
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

  const s = String(v)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim();
  if (!s) return null;

  const num = Number(s);
  if (isNaN(num)) return null;
  return num;
};

// ✅ headers aliases: import will accept BOTH export-format & your custom-format
const HEADER_ALIASES: Record<string, string[]> = {
  site: ["site"],
  date: ["date"],
  expense: ["expense", "expenses"],
  summary: ["summary", "exp summary", "exp summary "],
  payment: ["payment"],
  amount: ["amount"],
};

const findHeaderIndex = (headers: string[], key: keyof typeof HEADER_ALIASES) => {
  const aliases = HEADER_ALIASES[key].map((a) => normalize(a));
  return headers.findIndex((h) => aliases.includes(normalize(h)));
};

const readExcelRows = async (
  file: File
): Promise<{ rows: ImportRow[]; errors: { row: number; message: string }[] }> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  if (!ws) return { rows: [], errors: [{ row: 0, message: "Sheet not found" }] };

  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
  if (!raw.length) return { rows: [], errors: [{ row: 0, message: "Excel is empty" }] };

  const headerRow = raw[0].map((h) => String(h ?? "").trim());
  const errors: { row: number; message: string }[] = [];

  const idxSite = findHeaderIndex(headerRow, "site");
  const idxDate = findHeaderIndex(headerRow, "date");
  const idxExpense = findHeaderIndex(headerRow, "expense");
  const idxSummary = findHeaderIndex(headerRow, "summary");
  const idxPayment = findHeaderIndex(headerRow, "payment");
  const idxAmount = findHeaderIndex(headerRow, "amount");

  const missing: string[] = [];
  if (idxSite === -1) missing.push("Site");
  if (idxDate === -1) missing.push("Date");
  if (idxExpense === -1) missing.push("Expenses/Expense");
  if (idxSummary === -1) missing.push("Exp. Summary/Summary");
  if (idxPayment === -1) missing.push("Payment");
  if (idxAmount === -1) missing.push("Amount");

  if (missing.length) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `Invalid header. Missing: ${missing.join(
            ", "
          )}. Allowed headers: Site, Date, Expense(s), Summary/Exp. Summary, Payment, Amount`,
        },
      ],
    };
  }

  const rows: ImportRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    const excelRowNo = i + 1;

    // ✅ skip fully empty row
    const allEmpty = r.every((cell) => String(cell ?? "").trim() === "");
    if (allEmpty) continue;

    const siteVal = r[idxSite];
    const dateVal = r[idxDate];
    const expenseVal = r[idxExpense];
    const summaryVal = r[idxSummary];
    const paymentVal = r[idxPayment];
    const amountVal = r[idxAmount];

    const siteName = String(siteVal ?? "").trim();
    if (!siteName) {
      errors.push({ row: excelRowNo, message: "Site is required" });
      continue;
    }

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
      errors.push({ row: excelRowNo, message: "Expenses/Expense is required" });
      continue;
    }

    const amount = parseAmount(amountVal);
    if (amount === null || amount <= 0) {
      errors.push({ row: excelRowNo, message: "Amount must be > 0" });
      continue;
    }

    rows.push({
      siteName,
      date,
      expenseTitle,
      expenseSummary: String(summaryVal ?? "").trim(),
      paymentDetails: String(paymentVal ?? "").trim(),
      amount,
    });
  }

  return { rows, errors };
};

export const importSiteExpenseExcel = async (params: {
  file: File;
  baseUrl: string;
  credentials?: RequestCredentials;
  onProgress?: (done: number, total: number) => void;
}): Promise<ImportResult> => {
  const { file, baseUrl, onProgress } = params;

  const apiBase = String(baseUrl || "").replace(/\/$/, "");

  const { rows, errors: parseErrors } = await readExcelRows(file);

  // ✅ If nothing parsed, return parse errors (this is your "0 rows" root cause)
  const result: ImportResult = {
    successCount: 0,
    failCount: 0,
    errors: [...parseErrors],
  };

  // SiteName -> siteId mapping (must match exactly)
  let siteMap = new Map<string, string>();
  try {
    const res = await fetch(`${apiBase}/api/sites?_ts=${Date.now()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    const sites: { id: string; siteName: string }[] = json?.data ?? [];
    siteMap = new Map(sites.map((s) => [String(s.siteName).trim().toLowerCase(), s.id]));
  } catch {
    // ignore, handled below
  }

  const total = rows.length;
  let done = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const excelRowNo = idx + 2; // header = 1

    try {
      const siteId = siteMap.get(r.siteName.toLowerCase()) || null;
      if (!siteId) {
        result.failCount++;
        result.errors.push({
          row: excelRowNo,
          message: `Site not found: "${r.siteName}" (must match exactly as in Sites master)`,
        });
        done++;
        onProgress?.(done, total);
        continue;
      }

      const payload: any = {
        siteId,
        expenseDate: r.date.toISOString(),
        expenseTitle: r.expenseTitle,
        expenseSummary: r.expenseSummary || undefined,
        paymentDetails: r.paymentDetails || undefined,
        amount: r.amount,
      };

      const res = await fetch(`${apiBase}/api/site-exp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Import failed");

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
