import { PageScreen } from "@/components/layout/PageScreen";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

/** /reports (hub) and /reports/<report-key> (a single report). */
export default async function ReportsCatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const route = slug?.length ? `/reports/${slug.join("/")}` : "/reports";
  return <PageScreen route={route} />;
}
