"use client";

import { useEffect } from "react";

import { stripLocale } from "@/services/seo/strip-locale";
import { findMetaRule } from "@/services/seo/meta-rules";
import { usePathname } from "next/navigation";

function upsertMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function upsertOG(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertIcon(href: string) {
  let tag = document.querySelector(`link[rel="icon"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "icon");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function upsertSchema(schemaJson: string | null | undefined) {
  const id = "ld-json-meta-sync";
  let tag = document.getElementById(id) as HTMLScriptElement | null;

  if (!schemaJson) {
    if (tag) tag.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("script");
    tag.id = id;
    tag.type = "application/ld+json";
    document.head.appendChild(tag);
  }
  tag.text = schemaJson;
}

export default function MetaSyncClient({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const run = async () => {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) return;

      const path = stripLocale(pathname || "/", locale);

      // ✅ اگر rule گفت از بک نگیر، همینجا override کن و تمام
      const rule = findMetaRule(path);
      if (rule?.skipServerMeta) {
        const md = typeof rule.metadata === "function" ? rule.metadata(locale, path) : rule.metadata;

        if (md?.title) document.title = String(md.title);

        // robots
        if (md?.robots) {
          if (typeof md.robots === "string") upsertMeta("robots", md.robots);
          else {
            const r = md.robots;
            const robotsStr = `${r.index === false ? "noindex" : "index"},${r.follow === false ? "nofollow" : "follow"}`;
            upsertMeta("robots", robotsStr);
          }
        }

        // schema برای صفحات skip → پاک کن
        upsertSchema(null);
        return;
      }

      const url = new URL(`${base.replace(/\/$/, "")}/meta/${locale}`);
      url.searchParams.set("path", path);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return;

      const json = await res.json();
      const meta = json?.meta;
      if (!meta) return;

      if (meta.titleSeo) document.title = meta.titleSeo;

      if (meta.descriptionSeo) upsertMeta("description", meta.descriptionSeo);
      if (meta.robots) upsertMeta("robots", meta.robots);

      if (meta.canonical) upsertLink("canonical", meta.canonical);

      if (meta.titleSeo) upsertOG("og:title", meta.titleSeo);
      if (meta.descriptionSeo) upsertOG("og:description", meta.descriptionSeo);
      if (meta.urlPage) upsertOG("og:url", meta.urlPage);
      if (meta.siteName) upsertOG("og:site_name", meta.siteName);
      if (meta.imgSeo) upsertOG("og:image", meta.imgSeo);

      if (meta.favIcon) upsertIcon(meta.favIcon);

      upsertSchema(meta.schemaSeo);
    };

    run();

    const onPageShow = () => run();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [pathname, locale]);

  return null;
}