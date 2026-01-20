'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Images } from 'lucide-react'
import { STORAGE_URL } from '@/lib/apiClient'

const images = [
  'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',
  'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',
  'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',
  'uploads/other/branch/1403-04-09/photos/photo-ccefde4c1c89af85249246b7d9c0eb32.webp',

]

export function ImageGallery() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, index) => (
          <div
            key={index}
            className={`relative ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-video'} cursor-pointer overflow-hidden group`}
            onClick={() => setActiveIndex(index)}
          >
            <Image
              src={STORAGE_URL + img || "/placeholder.svg"}
              alt={`تصویر ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            {index === 3 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-teal-600 mr-[-2px]" fill="currentColor" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Photo Counter Badge */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
        <Images className="w-4 h-4" />
        <span>+۹۵ تصویر دیگر</span>
      </div>
    </div>
  )
}
