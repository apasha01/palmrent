/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AxiosResponse } from "axios";
import axios from "@/lib/axios";

export type StaticPageMeta = {
  titleSeo?: string;
  descriptionSeo?: string;
  schemaSeo?: string | null;
  imgSeo?: string | null;
  favIcon?: string | null;
  logo?: string | null;
  canonical?: string | null;
  robots?: string | null;
  siteName?: string | null;
  urlPage?: string | null;
  alternate?: Array<{
    lang: string;
    url: string;
  }>;
  branches_menu?: Array<{
    id: number;
    title: string;
  }>;
  profile?: string | false | null;
};

export type StaticPageData = {
  key?: string;
  title?: string;
  content?: string;
};

export type StaticPageApiResponse = {
  status?: number;
  meta?: StaticPageMeta;
  data?: StaticPageData;
  message?: string;
};

export type StaticPageResult = {
  status: number;
  meta: {
    titleSeo: string;
    descriptionSeo: string;
    schemaSeo: string | null;
    imgSeo: string | null;
    favIcon: string | null;
    logo: string | null;
    canonical: string | null;
    robots: string | null;
    siteName: string | null;
    urlPage: string | null;
    alternate: Array<{
      lang: string;
      url: string;
    }>;
    branches_menu: Array<{
      id: number;
      title: string;
    }>;
    profile: string | false | null;
  };
  data: {
    key: string;
    title: string;
    content: string;
  };
};

function normalizeStaticPageResponse(
  res: AxiosResponse<StaticPageApiResponse>,
): StaticPageResult {
  const body = res?.data;

  return {
    status: typeof res?.status === "number" ? res.status : 500,
    meta: {
      titleSeo: body?.meta?.titleSeo ?? "",
      descriptionSeo: body?.meta?.descriptionSeo ?? "",
      schemaSeo: body?.meta?.schemaSeo ?? null,
      imgSeo: body?.meta?.imgSeo ?? null,
      favIcon: body?.meta?.favIcon ?? null,
      logo: body?.meta?.logo ?? null,
      canonical: body?.meta?.canonical ?? null,
      robots: body?.meta?.robots ?? null,
      siteName: body?.meta?.siteName ?? null,
      urlPage: body?.meta?.urlPage ?? null,
      alternate: Array.isArray(body?.meta?.alternate)
        ? body.meta.alternate
        : [],
      branches_menu: Array.isArray(body?.meta?.branches_menu)
        ? body.meta.branches_menu
        : [],
      profile: body?.meta?.profile ?? null,
    },
    data: {
      key: body?.data?.key ?? "",
      title: body?.data?.title ?? "",
      content: body?.data?.content ?? "",
    },
  };
}

async function fetchStaticPage(endpoint: string): Promise<StaticPageResult> {
  const res = await axios.get<StaticPageApiResponse>(endpoint, {
    validateStatus: () => true,
  });

  return normalizeStaticPageResponse(res);
}

export async function getRulesPage(lang: string): Promise<StaticPageResult> {
  return fetchStaticPage(`/rules/${lang}`);
}

export async function getFaqPage(lang: string): Promise<StaticPageResult> {
  return fetchStaticPage(`/faq/${lang}`);
}

export async function getDocumentPage(lang: string): Promise<StaticPageResult> {
  return fetchStaticPage(`/document/${lang}`);
}

export async function getContactUsPage(
  lang: string,
): Promise<StaticPageResult> {
  return fetchStaticPage(`/contactus/${lang}`);
}

export async function getAboutUsPage(lang: string): Promise<StaticPageResult> {
  return fetchStaticPage(`/aboutus/${lang}`);
}