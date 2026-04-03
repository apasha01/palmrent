/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Header from "@/components/layouts/Header";
import Footer from "@/components/Footer";
import { getContactUsPage } from "@/services/settings/setting-service.api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const response = await getContactUsPage(locale);

  if (response.status === 404) {
    return {
      title: "Contact Us Not Found | Palm Rent",
      description: "This page could not be found.",
      robots: "noindex, nofollow",
    };
  }

  if (response.status !== 200) {
    return {
      title: "Contact Us | Palm Rent",
      description: "Contact Us | Palm Rent",
      robots: "noindex, nofollow",
    };
  }

  const meta = response.meta;

  return {
    title: meta?.titleSeo || "Contact Us | Palm Rent",
    description: meta?.descriptionSeo || "Contact Us | Palm Rent",
    robots: meta?.robots || "index, follow",
    icons: {
      icon: meta?.favIcon || "/favicon.png",
    },
    alternates: {
      canonical: meta?.canonical || undefined,
      languages: Array.isArray(meta?.alternate)
        ? Object.fromEntries(
            meta.alternate
              .filter((item) => item?.lang && item?.url)
              .map((item) => [item.lang, item.url]),
          )
        : undefined,
    },
    openGraph: {
      title: meta?.titleSeo || "Contact Us | Palm Rent",
      description: meta?.descriptionSeo || "Contact Us | Palm Rent",
      url: meta?.urlPage || undefined,
      siteName: meta?.siteName || "Palm Rent",
      images: meta?.imgSeo ? [meta.imgSeo] : [],
    },
  };
}

export default async function ContactUsPage({ params }: PageProps) {
  const { locale } = await params;

  const response = await getContactUsPage(locale);

  if (response.status === 404) {
    notFound();
  }

  if (response.status !== 200) {
    throw new Error(`Failed to load contact us page. Status: ${response.status}`);
  }

  return (
    <>
      <Header />

      {response.meta?.schemaSeo ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: response.meta.schemaSeo }}
        />
      ) : null}

      <main className="container mx-auto px-2 py-6">
        <div className="mx-auto max-w-7xl">
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: response.data?.content || "",
            }}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}