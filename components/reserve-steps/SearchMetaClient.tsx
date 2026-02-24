"use client";

import { useEffect } from "react";

function upsertMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
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

type Props = {
  title: string;
  description?: string;
};

export default function SearchMetaClient({ title, description }: Props) {
  useEffect(() => {
    if (!title) return;

    document.title = title;
    upsertOG("og:title", title);

    if (description) {
      upsertMeta("description", description);
      upsertOG("og:description", description);
    }
  }, [title, description]);

  return null;
}