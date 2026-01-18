import { Stars } from "lucide-react";
import Image from "next/image";
import React from "react";

const FavoriteBrands = () => {
  return (
    <div>
      <div className="flex flex-col ">
        <div className="flex gap-2 px-4 md:px-2 lg:px-0">
          <Stars />
          <p className="font-bold text-lg">محبوب ترین برند ها</p>
        </div>

        {/* فقط این قسمت اصلاح شده */}
        <div
          className="
            flex mt-2 gap-4 
            overflow-x-auto overflow-y-hidden
            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
        >
          {/* آیتم‌ها: فقط shrink-0 اضافه شده */}
          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>

          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>

          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>

          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>

          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>

          <div className="border shadow-sm flex flex-col rounded-lg overflow-hidden shrink-0">
            <div className="p-1 bg-white dark:bg-gray-900">
              <Image
                alt="brand picture"
                src="/images/brands/benzz.png"
                width={110}
                height={110}
              />
            </div>
            <p className="text-center py-2 font-medium">لندکروز</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteBrands;
