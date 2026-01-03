"use client"

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Video from "yet-another-react-lightbox/plugins/video";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useDisableScroll from "@/hooks/useDisableScroll";
import { changeSingleGalleryStatus } from "@/redux/slices/globalSlice";

function transformAllGalleryData(apiData) {
  const slides = [];
  
  apiData.forEach(item => {
    if (item.galleries && item.galleries.length > 0) {
      // تمام آیتم‌های گالری را پردازش می‌کنیم
      item.galleries.forEach(galleryItem => {
        if (galleryItem.type === "video") {
          slides.push({
            type: "video",
            width: 1280,
            height: 720,
            poster: item.photo,
            sources: [
              { 
                src: galleryItem.file, 
                type: `video/${galleryItem.file.split('.').pop()}` 
              }
            ],
          });
        } else {
          slides.push({
            src: galleryItem.file,
          });
        }
      });
    } else {
      // اگر گالری وجود نداشت، فقط عکس اصلی را اضافه می‌کنیم
      slides.push({
        src: item.photo,
      });
    }
  });
  
  return slides;
}


export default function SingleCarPopupGallery({data}) {
  console.log(data)
  useDisableScroll()
  return(
    <SingleCarPopupGallerySupport data={data}/>
  )
}

export function SingleCarPopupGallerySupport({data}){
    const slides = transformAllGalleryData(data)
    const isSingleGalleryOpen = useSelector((state)=>state.global.isSingleGalleryOpen)
    const [autoPlay, setAutoPlay] = useState(true);
    const [loop, setLoop] = useState(true);
    const dispatch = useDispatch()
    function closeGallery(){
        dispatch(changeSingleGalleryStatus(false))
    }
  return (
    <>
      <button onClick={() => setOpen(true)}>نمایش گالری</button>
      <Lightbox
        open={isSingleGalleryOpen}
        close={closeGallery}
        video={{
          autoPlay,
          loop,
        }}
        slides={slides}
        plugins={[Thumbnails, Video]}
      />
    </>
  );
}