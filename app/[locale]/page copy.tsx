/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
import HomeComponent from "@/components/HomePage"
import { BASE_URL } from "../../lib/apiClient"

async function getHomeData(locale: any) {
  try {
 const res = await fetch(`${BASE_URL}/home/${locale}`, {

      next: { revalidate: 60 }
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch data')
    }
    
    return res.json()
  } catch (error) {
    console.error('Error fetching home data:', error)
    return { data: null, meta: null }
  }
}

export async function generateMetadata({ params } : { params: any }) {
  const { locale } = await params;
  const response = await getHomeData(locale)
  
  if (!response.meta) {
    return {
      title: "سامانه آنلاین اجاره خودرو بدون دپوزیت | پالم رنت",
      description: "اجاره خودرو در دبی، استانبول و عمان بدون دپوزیت! رزرو آسان، پرداخت ریالی، بیمه رایگان و تحویل در محل. بهترین قیمت و پشتیبانی ۲۴/۷.",
    }
  }

  const { meta } = response;

  return {
    title: meta.titleSeo,
    description: meta.descriptionSeo,
    robots: meta.robots,
    icons: {
      icon: meta.favIcon || '/favicon.png',
    },
    openGraph: {
      title: meta.titleSeo,
      description: meta.descriptionSeo,
      images: [meta.imgSeo],
      url: meta.urlPage,
      siteName: meta.siteName,
    },
    alternates: {
      canonical: meta.canonical,
    },
    ...(meta.schemaSeo && {
      other: {
        'script:ld+json': meta.schemaSeo,
      }
    }),
  }
}

export default async function HomePage({ params } : { params: any }) {
  const { locale } = await params;

  const response = await getHomeData(locale)
  const initialData = response.data
  
  return <HomeComponent data={initialData} />
}

