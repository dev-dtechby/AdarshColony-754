"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Download,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";


import {
  exportSiteListToExcel,
  exportSiteListToPDF,
} from "./siteExportUtils";

import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";

/* ================= TYPES ================= */
type DocumentType = "SD" | "WORK_ORDER" | "TENDER";

interface SiteDocument {
  id: string;
  type: DocumentType;
  secureUrl: string;
  originalName?: string | null;
}

interface Site {
  id: string;
  siteName: string;
  tenderNo?: string | null;
  sdAmount?: number | null;
  department?: {
    id: string;
    name: string;
  } | null;
  sdFile?: SiteDocument | null;
  workOrderFile?: SiteDocument | null;
  tenderDocs?: SiteDocument[];
}

/* ================= API ================= */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const API_URL = `${BASE_URL}/api/sites`;

/* ================= HELPERS ================= */
const isImage = (url: string) => /\.(jpg|jpeg|png|webp)$/i.test(url);
const isPdf = (url: string) => /\.pdf$/i.test(url);

const getDownloadUrl = (url: string) =>
  url.includes("/upload/")
    ? url.replace("/upload/", "/upload/fl_attachment/")
    : url;

/* ================= COMPONENT ================= */
export default function SiteListTable() {
  const router = useRouter();
  const { lang } = useParams();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<SiteDocument | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  /* 🔥 DELETE STATES (ONLY ADDITION) */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchSites = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await fetch(API_URL);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Route not found");
      setSites(json.data || []);
    } catch (err: any) {
      setApiError(err.message || "Route not found");
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  /* ================= SEARCH ================= */
  const filteredSites = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return sites;

    return sites.filter((s) =>
      [
        s.siteName,
        s.tenderNo,
        s.department?.name,
        s.sdAmount?.toString(),
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(q)
        )
    );
  }, [sites, search]);

  /* ================= SOFT DELETE (UPDATED) ================= */
  const confirmDelete = async () => {
    if (!selectedSite) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`${API_URL}/${selectedSite.id}`, {
        method: "DELETE", // ✅ SOFT DELETE
      });

      if (!res.ok) throw new Error();

      setDeleteOpen(false);
      setSelectedSite(null);
      fetchSites();
    } catch {
      alert("❌ Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ================= EXPORT DATA ================= */
  const exportData = filteredSites.map((s) => ({
    "Site Name": s.siteName,
    "Tender No": s.tenderNo || "",
    Department: s.department?.name || "",
    "SD Amount": s.sdAmount || "",
    "SD URL": s.sdFile?.secureUrl || "",
    "Work Order URL": s.workOrderFile?.secureUrl || "",
    "Tender Docs URL": s.tenderDocs
      ?.map((d) => d.secureUrl)
      .join(", "),
  }));

  /* ================= UI ================= */
  return (
    <>
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <CardTitle className="text-lg font-semibold">
              All Site List
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search Site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-64"
              />

              <Button
                variant="outline"
                onClick={() => exportSiteListToExcel(exportData, "All_Sites")}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>

              <Button
                variant="outline"
                onClick={() => exportSiteListToPDF(exportData, "All_Sites")}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <table className="min-w-[1600px] w-full text-sm">
              <thead className="bg-muted/80 border-b border-border">
                <tr>
                  {[
                    "Site Name",
                    "Tender No",
                    "Department",
                    "SD Amount",
                    "SD",
                    "Work Order",
                    "Tender Docs",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  !apiError &&
                  filteredSites.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-primary/10">
                      <td className="px-4 py-3 font-medium">{s.siteName}</td>
                      <td className="px-4 py-3">{s.tenderNo || "-"}</td>
                      <td className="px-4 py-3">
                        {s.department?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {s.sdAmount ? `₹ ${s.sdAmount}` : "-"}
                      </td>

                      <td className="px-4 py-3">
                        {s.sdFile && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setPreviewDoc(s.sdFile!)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {s.workOrderFile && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              setPreviewDoc(s.workOrderFile!)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {s.tenderDocs?.map((d) => (
                          <Button
                            key={d.id}
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                getDownloadUrl(d.secureUrl),
                                "_blank"
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ))}
                      </td>

                      {/* 🔥 ACTION – ONLY DELETE CHANGED */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/${lang}/create-new-site?id=${s.id}`
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="outline"
                            className="border-destructive"
                            onClick={() => {
                              setSelectedSite(s);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 🔥 DELETE CONFIRM DIALOG (ONLY ADDITION) */}
      <DeleteConfirmDialog
        open={deleteOpen}
        title="Delete Site?"
        description="This site will be moved to Deleted Records. You can restore it later."
        loading={deleteLoading}
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedSite(null);
        }}
        onConfirm={confirmDelete}
      />

      {/* PREVIEW MODAL – SAME */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-background p-4 rounded-lg w-[90%] h-[90%]">
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                {previewDoc.originalName || "Document Preview"}
              </span>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
            </div>

            {isImage(previewDoc.secureUrl) ? (
              <img
                src={previewDoc.secureUrl}
                className="w-full h-full object-contain"
              />
            ) : isPdf(previewDoc.secureUrl) ? (
              <iframe
                src={previewDoc.secureUrl}
                className="w-full h-full rounded"
              />
            ) : (
              <p className="text-center">Unsupported file</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
