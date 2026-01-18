import Image from "next/image";
import React from "react";

const TinyInformation = () => {
  return (
    <div className="mt-8">
      {/* فقط ستون‌ها ریسپانسیو شدن */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-2 lg:px-0 gap-4">
        
        <div className="flex gap-2">
          <div className="w-28 h-28 relative shrink-0">
            <Image
              alt="helper text"
              src="/images/oman-min.jpg"
              fill
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col items-start justify-start">
            <p> بدون دیپوزیت </p>
            <p className="text-wrap">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Totam,
              accusamus? Iste ex.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-28 h-28 relative shrink-0">
            <Image
              alt="helper text"
              src="/images/oman-min.jpg"
              fill
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col items-start justify-start">
            <p> بدون دیپوزیت </p>
            <p className="text-wrap">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Totam,
              accusamus? Iste ex.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-28 h-28 relative shrink-0">
            <Image
              alt="helper text"
              src="/images/oman-min.jpg"
              fill
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col items-start justify-start">
            <p> بدون دیپوزیت </p>
            <p className="text-wrap">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Totam,
              accusamus? Iste ex.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TinyInformation;
