'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Range } from 'react-range';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions
import { changeFilterStatus } from '@/redux/slices/globalSlice';
import { changeSelectedCategories, changeSelectedPriceRange, toggleSelectedCategory } from '@/redux/slices/searchSlice';

// Icons & Hooks
import useDisableScroll from '@/hooks/useDisableScroll';
import { IconBenefit, IconBrand, IconClose, IconDollar, IconGearBox2, IconRefresh, IconTick3 } from './Icons';

export default function SearchFilterPopup() {
   const t = useTranslations();
   const locale = useLocale();
   const dispatch = useDispatch();
   const [isExiting, setIsExiting] = useState(false);

   // تشخیص جهت زبان
   const isRtl = locale === 'fa' || locale === 'ar';

   // Disable body scroll when popup is open
   useDisableScroll();

   // Redux State
   const selectedCategories = useSelector((state) => state.search.selectedCategories);
   const carListLength = useSelector((state) => state.carList.carList.length);

   // Handlers
   const closePopup = () => {
      setIsExiting(true);
      setTimeout(() => {
         dispatch(changeFilterStatus(false));
      }, 300);
   };

   const handleReset = () => {
      dispatch(changeSelectedCategories([]));
   };

   // Filter Groups Data
   // added 'shouldTranslate' flag to prevent translation errors on Brands
   const filterGroups = [
      {
         title: 'نوع خودرو',
         icon: <IconBrand />,
         shouldTranslate: true,
         items: [
            { id: 3, title: 'economicCar' },
            { id: 13, title: 'luxCar' },
            { id: 9, title: 'suv' },
            { id: 19, title: 'sport' },
            { id: 15, title: 'sevenplus' },
            { id: 21, title: 'crook' },
         ],
      },
      {
         title: 'برند',
         icon: <IconBrand />,
         shouldTranslate: false, // Don't translate brand names (Hyundai, BMW...)
         items: [
            { id: 28, title: 'Hyundai' },
            { id: 44, title: 'Mercedes-Benz' },
            { id: 24, title: 'Toyota' },
            { id: 25, title: 'Kia' },
            { id: 30, title: 'BMW' },
         ],
      },
      {
         title: 'گیربکس',
         icon: <IconGearBox2 />,
         shouldTranslate: true,
         items: [
            { id: 901, title: 'automatic' },
            { id: 902, title: 'geared' },
         ],
      },
      {
         title: 'امکانات',
         icon: <IconBenefit />,
         shouldTranslate: true,
         items: [
            { id: 14, title: 'noDeposite' },
            { id: 2, title: 'freeDelivery' },
            { id: 4, title: 'unlimitedKilometers' },
         ],
      },
   ];

   return (
      <div className="fixed inset-0 z-[100] flex justify-end isolate overflow-hidden">
         {/* Backdrop */}
         <div onClick={closePopup} className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}></div>

         {/* Sidebar Panel */}
         <div
            className={`
                relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col
                transition-transform duration-300 ease-out
                ${isExiting ? (isRtl ? '-translate-x-full' : 'translate-x-full') : 'translate-x-0'}
            `}
            style={{
               marginInlineStart: 'auto',
            }}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white z-10">
               <h2 className="text-lg font-bold text-gray-800">{t('filters')}</h2>

               <div className="flex items-center gap-3">
                  {selectedCategories.length > 0 && (
                     <button onClick={handleReset} className="text-red-500 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
                        <IconRefresh className="size-4" />
                        <span className="hidden sm:inline">حذف فیلترها</span>
                     </button>
                  )}
                  <button onClick={closePopup} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                     <IconClose className="size-6 text-gray-700" />
                  </button>
               </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-8 hide-scrollbar">
               {/* Price Range */}
               <section>
                  <div className="flex items-center gap-2 mb-6 text-gray-800">
                     <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <IconDollar size="20" />
                     </span>
                     <h3 className="font-bold">بازه قیمتی (روزانه)</h3>
                  </div>
                  <div className="px-2">
                     <PriceRange isRtl={isRtl} />
                  </div>
               </section>

               <hr className="border-gray-100" />

               {/* Dynamic Sections */}
               {filterGroups.map((group, index) => (
                  <div key={index}>
                     <div className="flex items-center gap-2 mb-4 text-gray-800">
                        <span className="p-2 bg-gray-50 rounded-lg text-gray-600">{group.icon}</span>
                        <h3 className="font-bold">{group.title}</h3>
                     </div>

                     <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                           <FilterChip key={item.id} id={item.id} label={group.shouldTranslate ? t(item.title) : item.title} />
                        ))}
                     </div>
                     {index < filterGroups.length - 1 && <hr className="border-gray-100 mt-6" />}
                  </div>
               ))}
            </div>

            {/* Sticky Footer */}
            <div className="absolute bottom-0 inset-inline-0 w-full p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
               <button onClick={closePopup} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-lg py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200 flex justify-between px-6">
                  <span>مشاهده نتایج</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm flex items-center">{carListLength} خودرو</span>
               </button>
            </div>
         </div>
      </div>
   );
}

/**
 * Filter Chip Component
 */
function FilterChip({ id, label }) {
   const dispatch = useDispatch();
   const selectedCategories = useSelector((state) => state.search.selectedCategories);
   const isSelected = selectedCategories.includes(id);

   return (
      <button
         onClick={() => dispatch(toggleSelectedCategory(id))}
         className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                flex items-center gap-2 select-none
                ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
            `}
      >
         {isSelected && <IconTick3 className="size-3 text-white" />}
         {label}
      </button>
   );
}

/**
 * Price Range Component
 */
export function PriceRange({ isRtl }) {
   const dispatch = useDispatch();
   const t = useTranslations();

   const priceRange = useSelector((state) => state.search.priceRange);
   const selectedPriceRange = useSelector((state) => state.search.selectedPriceRange);
   const currency = useSelector((state) => state.search.currency) || 'AED';

   // Safe Fallback
   const safePriceRange = priceRange && priceRange.length >= 2 ? priceRange : [0, 50000];
   const MIN_LIMIT = Math.min(...safePriceRange);
   const MAX_LIMIT = Math.max(...safePriceRange);

   const [values, setValues] = useState([MIN_LIMIT, MAX_LIMIT]);

   useEffect(() => {
      if (selectedPriceRange && selectedPriceRange.length >= 2) {
         setValues([Math.min(...selectedPriceRange), Math.max(...selectedPriceRange)]);
      } else {
         setValues([MIN_LIMIT, MAX_LIMIT]);
      }
   }, [priceRange]);

   const handleFinalChange = (finalValues) => {
      dispatch(changeSelectedPriceRange(finalValues));
   };

   return (
      <div className="w-full pt-4">
         <div className="relative h-6 flex items-center">
            <Range
               step={10}
               min={MIN_LIMIT}
               max={MAX_LIMIT}
               values={values}
               rtl={isRtl}
               onChange={(values) => setValues(values)}
               onFinalChange={handleFinalChange}
               renderTrack={({ props, children }) => {
                  const [min, max] = values;
                  const percentStart = ((min - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100;
                  const percentWidth = ((max - min) / (MAX_LIMIT - MIN_LIMIT)) * 100;

                  return (
                     <div {...props} style={{ ...props.style }} className="w-full h-1.5 bg-gray-100 rounded-full relative">
                        <div
                           className="absolute top-0 h-full bg-blue-600 rounded-full"
                           style={{
                              [isRtl ? 'right' : 'left']: `${percentStart}%`,
                              width: `${percentWidth}%`,
                           }}
                        />
                        {children}
                     </div>
                  );
               }}
               renderThumb={({ props }) => {
                  // FIX: Destructure key to avoid spreading it into div props
                  const { key, style, ...restProps } = props;
                  return (
                     <div key={key} {...restProps} style={{ ...style }} className="w-6 h-6 bg-white rounded-full border-2 border-blue-600 shadow-[0_2px_4px_rgba(0,0,0,0.15)] cursor-grab focus:outline-none flex items-center justify-center top-[0px]">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                     </div>
                  );
               }}
            />
         </div>

         <div className="flex justify-between items-center mt-5 text-[#4b5259]">
            <div className="flex flex-col items-center border border-gray-200 rounded-lg p-2 px-3 min-w-[100px]">
               <span className="text-[10px] text-gray-400">حداقل</span>
               {/* Currency is displayed directly, not translated */}
               <span className="font-bold text-sm text-center" dir="ltr">
                  {values[0].toLocaleString()} <small className="text-[10px]">{currency}</small>
               </span>
            </div>
            <div className="w-4 h-[2px] bg-gray-300"></div>
            <div className="flex flex-col items-center border border-gray-200 rounded-lg p-2 px-3 min-w-[100px]">
               <span className="text-[10px] text-gray-400">حداکثر</span>
               {/* Currency is displayed directly, not translated */}
               <span className="font-bold text-sm text-center" dir="ltr">
                  {values[1].toLocaleString()} <small className="text-[10px]">{currency}</small>
               </span>
            </div>
         </div>
      </div>
   );
}
