/* eslint-disable @typescript-eslint/no-explicit-any */

export type BlogItem = {
  id: number;
  title: string;
  text: string;
  branch: string;
  photo: string | null;
};

export type BlogsMetaAlternate = {
  hreflang?: string;
  href?: string;
};

export type BlogsMeta = {
  titleSeo?: string;
  descriptionSeo?: string;
  schemaSeo?: string;
  imgSeo?: string | null;
  favIcon?: string | null;
  logo?: string | null;
  canonical?: string;
  robots?: string;
  siteName?: string;
  urlPage?: string;
  alternate?: BlogsMetaAlternate[];
};

export type BlogsApiData = {
  items?: BlogItem[];
  index_description?: string;
};

export type BlogsApiResponse = {
  status: number;
  meta?: BlogsMeta;
  data?: BlogsApiData;
};

export type BlogsResult = {
  items: BlogItem[];
  index_description: string;
  meta?: BlogsMeta;
};