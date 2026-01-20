// src/app/[locale]/blogs/[id]/page.jsx

import { getData } from "@/lib/getData";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconDate, IconPerson2 } from "@/components/Icons";
import { BASE_URL, STORAGE_URL } from "../../../../lib/apiClient";

export const dynamic = "force-dynamic";

async function getPostBySlug(slug, locale) {
  try {
    if (!slug) return null;
    const lang = locale || "fa";
    const data = await getData(`${BASE_URL}/blog/${slug}/${lang}`);
    return data ?? null;
  } catch (error) {
    console.error("خطا در دریافت پست:", error);
    return null;
  }
}

export default async function BlogPost({ params }) {
  const { id, locale } = await Promise.resolve(params);

  const post = await getPostBySlug(id, locale);

  if (!post?.data?.item) notFound();

  const data = post.data;
  const item = data.item;

  // ✅ لاگ عکس اصلی پست
  const mainPhotoRaw = item?.photo;
  const mainPhotoFinal =
    mainPhotoRaw?.startsWith("http") ? mainPhotoRaw : `${STORAGE_URL}${mainPhotoRaw}`;


  return (
    <div className="xl:w-[85vw] w-[95vw] m-auto max-w-[1336px]">
      <div className="flex w-full lg:flex-row flex-col">
        <article className="lg:w-8/12 w-full container mx-auto px-4 py-8 flex flex-col gap-8">
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full animate-skeleton rounded-lg">
              <Image
                className="w-full h-full object-cover rounded-lg"
                src={mainPhotoFinal}
                width={856}
                height={481}
                alt={item.title || ""}
                priority
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">{item.title}</h1>

            <div className="w-full flex items-center text-[#727272] gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 gap-2 border border-[#727272] p-1.5 rounded-full justify-center items-center">
                  <IconPerson2 className={undefined} />
                </span>
                {item.author}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex size-8 gap-2 border border-[#727272] p-1.5 rounded-full justify-center items-center">
                  <IconDate />
                </span>
                {item.date}
              </div>
            </div>
          </div>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: item.text }}
          />
        </article>

        <div className="lg:w-4/12 w-full">
          <div className="sticky top-8 border border-[#00000022] mt-8 rounded-lg p-4 flex flex-col gap-4">
            <div className="font-bold text-lg">مطالب مرتبط</div>

            {Array.isArray(data.last_blogs) &&
              data.last_blogs.map((b, index) => {
                const relatedId = b?.id ?? b?.slug;

                // ✅ لاگ عکس‌های مرتبط
                const relatedPhotoRaw = b?.photo;
                const relatedPhotoFinal =
                  relatedPhotoRaw?.startsWith("http")
                    ? relatedPhotoRaw
                    : `${STORAGE_URL}${relatedPhotoRaw}`;

                console.log("=== RELATED IMAGE DEBUG ===");
                console.log("index:", index);
                console.log("relatedId:", relatedId);
                console.log("b.photo (raw):", relatedPhotoRaw);
                console.log("b.photo (final):", relatedPhotoFinal);
                console.log("===========================");

                return (
                  <Link
                    key={relatedId ?? index}
                    href={`/${locale}/blogs/${relatedId}`}
                    className="p-2 border border-[#00000022] rounded-lg flex gap-2"
                  >
                    <div className="shrink-0 w-[125px] h-[70px] rounded-lg animate-skeleton">
                      <Image
                        className="rounded-lg w-full h-full object-cover"
                        src={relatedPhotoFinal}
                        width={125}
                        height={70}
                        alt={b.title || ""}
                      />
                    </div>

                    <div className="flex flex-col gap-2 flex-1 h-full relative pb-6">
                      <div>{b.title}</div>
                      <div className="text-xs font-bold flex justify-end absolute bottom-0 left-0">
                        {b.date}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
