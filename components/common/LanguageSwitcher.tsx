"use client";

import { usePathname, useRouter } from "next/navigation";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // pathname example: /en/registration/new
  const parts = (pathname || "/").split("/").filter(Boolean);
  const currentLang = parts[0] || "en";

  const changeLang = (nextLang: string) => {
    if (!parts.length) return router.push(`/${nextLang}`);
    parts[0] = nextLang; // replace lang segment
    router.push("/" + parts.join("/"));
  };

  return (
    <select
      className="border rounded-md px-2 py-1 bg-background text-sm"
      value={currentLang}
      onChange={(e) => changeLang(e.target.value)}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
