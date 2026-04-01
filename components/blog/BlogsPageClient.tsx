"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SingleBlogPost,
  SkeletonSingleBlogPost,
} from "@/components/RecentBlogPosts";
import { BASE_URL } from "@/lib/apiClient";

type BlogItem = {
  id: string | number;
  title: string;
  text: string;
  photo?: string | null;
};

type Props = {
  locale: string;
  initialBlogs: BlogItem[];
  initialHasMore: boolean;
};

type BlogsResponse = {
  data?: {
    items?: BlogItem[];
    has_more?: boolean;
  };
};

export default function BlogsPageClient({
  locale,
  initialBlogs,
  initialHasMore,
}: Props) {
  const [blogs, setBlogs] = useState<BlogItem[]>(initialBlogs ?? []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFirstRenderRef = useRef(true);

  const getData = useCallback(async (page: number) => {
    try {
      setIsLoading(true);

      const res = await fetch(`${BASE_URL}/blogs/${locale}?page=${page}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        setIsLoading(false);
        return;
      }

      const json: BlogsResponse = await res.json();
      const newItems = json?.data?.items ?? [];
      const newHasMore = json?.data?.has_more ?? false;

      setBlogs((prev) => [...prev, ...newItems]);
      setHasMore(newHasMore);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    getData(pageNumber);
  }, [pageNumber, getData]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPageNumber((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading]);

  return (
    <>
      <div className="flex w-full flex-wrap gap-2">
        {blogs.length === 0 && !isLoading
          ? Array(8)
              .fill(null)
              .map((_, index) => {
                return (
                  <div
                    key={index}
                    className="lg:w-[calc(25%-8px)] md:w-[calc(33%-8px)] sm:w-[calc(50%-4px)] w-full border border-[#0000001f] p-4 rounded-lg bg-white"
                  >
                    <SkeletonSingleBlogPost />
                  </div>
                );
              })
          : blogs.map((item, index) => {
              return (
                <div
                  key={item.id ?? index}
                  className="lg:w-[calc(25%-8px)] md:w-[calc(33%-8px)] sm:w-[calc(50%-4px)] w-full border border-[#0000001f] p-4 rounded-lg bg-white"
                >
                 <SingleBlogPost
  title={item.title}
  description={item.text}
  photo={item?.photo ?? ""}
  smallFont={true}
  bigPost={true}
  id={item.id}
/>
                </div>
              );
            })}

        {hasMore &&
          isLoading &&
          Array(4)
            .fill(null)
            .map((_, index) => {
              return (
                <div
                  key={`loading-${index}`}
                  className="lg:w-[calc(25%-8px)] md:w-[calc(33%-8px)] sm:w-[calc(50%-4px)] w-full border border-[#0000001f] p-4 rounded-lg bg-white"
                >
                  <SkeletonSingleBlogPost />
                </div>
              );
            })}
      </div>

      <div ref={loadMoreRef} className="h-10 w-full" />
    </>
  );
}