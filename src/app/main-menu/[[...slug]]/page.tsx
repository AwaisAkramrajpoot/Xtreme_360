import { PageScreen } from "@/components/layout/PageScreen";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function MainMenuCatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const route = slug?.length ? `/main-menu/${slug.join("/")}` : "/main-menu";
  return <PageScreen route={route} />;
}
