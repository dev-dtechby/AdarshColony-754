import DashboardPageView from "./page-view";
import { getDictionary } from "@/app/dictionaries";

/**
 * Allowed languages as per getDictionary()
 */
type Lang = "en" | "bn" | "ar";

interface PageProps {
  params: {
    lang: Lang;
  };
}

export default async function Page({ params }: PageProps) {
  const trans = await getDictionary(params.lang);
  return <DashboardPageView trans={trans} />;
}
