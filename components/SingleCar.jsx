'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions
import { selectCar } from '@/redux/slices/carListSlice';
import { changeRoadMapStep } from '@/redux/slices/globalSlice';
import { addReelItem, changeReelActive } from '@/redux/slices/reelsSlice';

// Utils & Helpers
import { adaptCarData } from '@/lib/adapters';
import { capitalizeWords } from '@/lib/capitalizeFirstLetter';
import { dateDifference } from '@/lib/getDateDiffrence';
import { getLangUrl } from '@/lib/getLangUrl';

// Icons
import {
  IconArrowHandle,
  IconBag,
  IconDiscount,
  IconGas,
  IconGearBox,
  IconHeart,
  IconInfoCircle,
  IconPerson,
  IconPlay,
  IconWhatsapp,
} from './Icons';

import { STORAGE_URL } from '@/lib/apiClient';

/**
 * Helpers
 */
const ensureLeadingSlash = (p) => {
  if (!p) return '';
  return p.startsWith('/') ? p : `/${p}`;
};

const toStorageUrl = (p) => {
  if (!p) return '';
  // اگر API یک وقت url کامل داد، دست نزن
  if (typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))) return p;
  return `${STORAGE_URL}${ensureLeadingSlash(String(p))}`;
};

const normalizeImages = (input) => {
  // انتظار داریم از API: photo => array of paths
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  // اگر اشتباهی string بود
  if (typeof input === 'string') return input ? [input] : [];
  return [];
};

/**
 * Main Single Car Card Component
 */
export default function SingleCar({ data, noBtn = false }) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const optionList = useSelector((state) => state.carList.optionList);

  // Adapt raw data
  const car = adaptCarData(data);
  const [isHovering, setIsHovering] = useState(false);

  // Fix: Destructure primitives to prevent useEffect dependency error
  const { id, title, video, price } = car || {};

  // ✅ تصاویر نرمال‌شده (path های دیتابیس)
  const images = useMemo(() => normalizeImages(car?.images), [car?.images]);

  // Register video to Redux
  useEffect(() => {
    if (video) {
      const videoData = { id, title, video, price };
      dispatch(addReelItem(videoData));
    }
  }, [id, title, video, price, dispatch]);

  if (!car) return null;

  return (
    <div
      className={`
        flex w-full flex-col bg-white cursor-pointer transition-all duration-300
        rounded-2xl md:text-sm text-xs border border-[#0000001f]
        shadow-[0_2px_5px_-1px_rgba(0,0,0,.08)] hover:shadow-lg
        ${isHovering ? 'z-30 relative' : ''}
        p-2.5 h-full justify-between
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <SingleCarGallery imageList={images} hasVideo={!!car.video} noBtn={noBtn}>
        {/* Badges Overlay */}
        <div className="flex text-[10px] absolute gap-2 max-[380px]:gap-1 text-nowrap flex-wrap top-2 rtl:right-2 ltr:left-2 w-full z-20 pointer-events-none">
          {/* Render Options from Raw Data if available */}
          {car.rawOptions &&
            car.rawOptions.map((item, index) => {
              if (!optionList[item]) return null;
              return (
                <div
                  key={index}
                  className={`sm:py-1 py-2 px-2 rounded-4xl ${
                    optionList[item].title === 'noDeposite'
                      ? 'bg-[#eafaee] border border-[#eafaee]'
                      : 'bg-[#e2e6e9]'
                  } flex items-center gap-1 shadow-sm`}
                >
                  <span
                    className={`${
                      optionList[item].title === 'noDeposite'
                        ? 'text-[#1e7b33]'
                        : 'text-[#4b5259]'
                    } font-bold flex items-center gap-1`}
                  >
                    {t(optionList[item].title)}
                    {optionList[item].title === 'noDeposite' && <IconInfoCircle size="12" />}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Discount Badge */}
        {car.discountPercent > 0 && (
          <div className="absolute bottom-2 left-2 z-20 bg-[#e1ff00] py-1 px-2 text-[#3b3d40] font-bold text-[10px] rounded-lg flex items-center gap-1 shadow-sm opacity-90">
            <IconDiscount size="14" />
            {car.discountPercent}% {t('discount')}
          </div>
        )}
      </SingleCarGallery>

      {/* Content Section */}
      <div className="pt-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-left text-base sm:text-lg font-bold truncate text-[#1a1a1a]">
            {capitalizeWords(car.title)}
          </h3>
          <span className="size-5 text-[#888] hover:text-red-500 transition-colors">
            <IconHeart active={false} />
          </span>
        </div>

        <SingleCarOptions car={car} />

        {/* Price Section */}
        <SingleCarPriceList
          priceList={car.priceList || car.dailyPrices}
          defaultPrice={car.price}
          oldPrice={car.oldPrice}
        />

        {/* Buttons */}
        {!noBtn && <SingleCarButtons car={car} />}
      </div>
    </div>
  );
}

/**
 * Gallery Component
 * ✅ اینجا فقط path می‌گیریم و خودمون STORAGE_URL می‌چسبونیم
 */
export function SingleCarGallery({ children, noBtn, imageList, hasVideo }) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ✅ اگر عکس نیومد
  const safeImageList = Array.isArray(imageList) && imageList.length > 0 ? imageList : ['/images/placeholder.png'];

  const handleMouseMove = (index) => setActiveImageIndex(index);
  const handleMouseLeave = () => setActiveImageIndex(0);

  const openVideoReel = (e) => {
    e.stopPropagation();
    dispatch(changeReelActive(true));
  };

  return (
    <div className="relative w-full aspect-[16/10] rounded-lg group z-10">
      {/* Mobile View: Horizontal Scroll (Slider) */}
      <div className="md:hidden flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-lg">
        {safeImageList.map((src, index) => (
          <div key={index} className="snap-center min-w-full h-full relative">
            <Image
              className="w-full h-full object-cover"
              src={toStorageUrl(src)}
              width={400}
              height={250}
              alt={`Car image ${index + 1}`}
              loading="lazy"
            />
            {index === safeImageList.length - 1 && safeImageList.length > 1 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                  {t('morePic')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View: Hover Stack */}
      <div className="hidden md:flex relative w-full h-full overflow-hidden rounded-lg">
        {safeImageList.map((src, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              index === activeImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              className="w-full h-full object-cover"
              src={toStorageUrl(src)}
              width={400}
              height={250}
              alt="Car image"
              loading="lazy"
            />

            {index === safeImageList.length - 1 && safeImageList.length > 1 && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                <span className="flex items-center justify-center border-2 border-white rounded-full size-12 mb-2 -rotate-45">
                  <IconArrowHandle className="size-5" />
                </span>
                <span className="text-xs font-bold">{t('moredetail')}</span>
              </div>
            )}
          </div>
        ))}

        {/* Hover Triggers */}
        <div className="absolute inset-0 z-20 flex" onMouseLeave={handleMouseLeave}>
          {safeImageList.map((_, index) => (
            <div key={index} className="flex-1 h-full" onMouseEnter={() => handleMouseMove(index)} />
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="absolute bottom-0 left-0 w-full flex p-1 gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          {safeImageList.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === activeImageIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {children}

      {/* Video Play Button */}
      {!noBtn && hasVideo && (
        <div
          onClick={openVideoReel}
          className="absolute right-2 bottom-2 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 cursor-pointer transition-all backdrop-blur-sm"
        >
          <IconPlay className="size-4 md:size-5" />
        </div>
      )}
    </div>
  );
}

/**
 * Options Component
 */
export function SingleCarOptions({ car, bigFont = false }) {
  const t = useTranslations();
  if (!car) return null;

  const iconSize = bigFont ? 'xl:size-5 size-4' : 'size-4';
  const textSize = bigFont ? 'xl:text-base sm:text-sm text-xs' : 'text-[10px] sm:text-xs';

  const fuel = car.fuel || 'Petrol';
  const gearboxKey = String(car.gearbox).toLowerCase();
  const gearbox =
    gearboxKey.includes('auto') || gearboxKey.includes('اتوماتیک') ? 'automatic' : 'geared';

  return (
    <div className={`grid grid-cols-4 gap-1 text-[#787878] border-t border-[#0000001F] py-2 mt-1 ${textSize}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
        <span className={iconSize}><IconGas /></span>
        <span className="truncate">{t(String(fuel === 'بنزین' ? 'petrol' : fuel).toLowerCase())}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
        <span className={iconSize}><IconGearBox /></span>
        <span>{t(gearbox)}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
        <span className={iconSize}><IconBag /></span>
        <span>{car.baggage || 0} {t('suitCase')}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
        <span className={iconSize}><IconPerson /></span>
        <span>{car.passengers || 0} {t('people')}</span>
      </div>
    </div>
  );
}

/**
 * Price List Component (همون کد خودت)
 */
export function SingleCarPriceList({ priceList, defaultPrice, oldPrice }) {
  const t = useTranslations();
  const carDates = useSelector((state) => state.global.carDates);
  const pathname = usePathname();
  const locale = useLocale();
  const langUrl = getLangUrl(locale);

  const isInSearchPage = pathname === (langUrl ? `${langUrl}/search` : '/search');

  const [displayInfo, setDisplayInfo] = useState({
    days: 1,
    price: defaultPrice || 0,
    oldPrice: oldPrice || 0,
  });

  const normalizePriceList = (list) => {
    if (!list) return [];
    if (Array.isArray(list)) return list;
    return Object.entries(list).map(([key, value]) => ({ range: key, ...value }));
  };

  useEffect(() => {
    let days = 1;
    if (carDates && carDates.length >= 2 && carDates[0] && carDates[1]) {
      try {
        const diff = dateDifference(carDates[0], carDates[1]);
        days = diff.days || 1;
      } catch (e) {
        days = 1;
      }
    }

    const pricesArray = normalizePriceList(priceList);

    const match = pricesArray.find((item) => {
      const rangeStr = item.range || '';
      const nums = rangeStr.match(/\d+/g);
      if (!nums) return false;
      const min = parseInt(nums[0]);
      const max = nums[1] ? parseInt(nums[1]) : 9999;
      return days >= min && days <= max;
    });

    let activePrice = defaultPrice;
    let activeOldPrice = oldPrice;

    if (match) {
      activePrice = parseFloat(match.final_price || match.currentPrice);
      activeOldPrice = parseFloat(match.base_price || match.previousPrice);
    } else if (pricesArray.length > 0) {
      const first = pricesArray[0];
      activePrice = parseFloat(first.final_price || first.currentPrice);
      activeOldPrice = parseFloat(first.base_price || first.previousPrice);
    }

    setDisplayInfo({ days, price: activePrice, oldPrice: activeOldPrice });
  }, [carDates, priceList, defaultPrice, oldPrice]);

  const pricesArray = normalizePriceList(priceList);

  return (
    <div className="flex flex-col gap-1 my-3 mt-auto border-t pt-2 border-[#0000001f]">
      {isInSearchPage ? (
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-[#4b5259] text-xs sm:text-sm">
            {t('BSPrice')} {displayInfo.days} {t('day')}
          </span>
          <div className="flex flex-col items-end">
            {displayInfo.oldPrice > displayInfo.price && (
              <span className="text-[#A7A7A7] line-through text-[10px] decoration-red-500">
                {displayInfo.oldPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1">
              <span className="text-[#3B82F6] font-bold text-base sm:text-lg">
                {displayInfo.price.toLocaleString()}
              </span>
              <span className="text-xs text-[#4b5259]">{t('AED')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {pricesArray.map((item, index) => {
            if (index > 3) return null;

            const current = parseFloat(item.final_price || item.currentPrice || 0);
            const previous = parseFloat(item.base_price || item.previousPrice || 0);

            let rangeText = item.range;
            const nums = (item.range || '').match(/\d+/g);
            if (nums && nums.length > 0) {
              if (nums.length === 2) rangeText = `${t('from')} ${nums[0]} ${t('to')} ${nums[1]} ${t('day')}`;
              else rangeText = `${t('moreThan')} ${nums[0]} ${t('day')}`;
            }

            return (
              <div key={index} className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-gray-600">{rangeText}</span>
                <div className="flex gap-1 items-center">
                  {previous > current && (
                    <span className="text-[#A7A7A7] line-through decoration-red-500">
                      {previous.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[#3B82F6] font-bold">{current.toLocaleString()}</span>
                  <span className="text-[9px] text-[#4b5259]">{t('AED')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isInSearchPage && (
        <div className="flex justify-between text-[10px] text-gray-400 px-1">
          <span>{t('daily')}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Action Buttons Component (همون کد خودت)
 */
export function SingleCarButtons({ car }) {
  const t = useTranslations();
  const router = useRouter();
  const dispatch = useDispatch();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const carDates = useSelector((state) => state.global.carDates);
  const deliveryTime = useSelector((state) => state.global.deliveryTime);
  const returnTime = useSelector((state) => state.global.returnTime);
  const [whatsappText, setWhatsappText] = useState('');

  useEffect(() => {
    if (carDates && carDates.length >= 2) {
      try {
        const days = dateDifference(carDates[0], carDates[1]).days || 1;
        setWhatsappText(
          `سلام، مایل هستم خودروی ${car.title} را در دبی از تاریخ ${carDates[0]} (${deliveryTime}) تا ${carDates[1]} (${returnTime}) به مدت ${days} روز رزرو کنم.`
        );
      } catch (e) {
        setWhatsappText(`Hello, I am interested in ${car.title}.`);
      }
    }
  }, [carDates, deliveryTime, returnTime, car.title]);

  function handleBooking() {
    dispatch(selectCar(car.id));
    dispatch(changeRoadMapStep(2));

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('step', '2');
    currentParams.set('car_id', car.id);

    if (carDates[0]) currentParams.set('from', carDates[0]);
    if (carDates[1]) currentParams.set('to', carDates[1]);

    router.push(`/${locale}/search?${currentParams.toString()}`);
  }

  return (
    <div className="flex w-full gap-2 mt-1">
      <button
        onClick={handleBooking}
        className="flex-1 rounded-xl py-2 flex justify-center items-center gap-2 cursor-pointer bg-[#0077db] hover:bg-[#0062b3] text-white font-bold text-sm transition-colors shadow-sm shadow-blue-200"
      >
        {t('chooseCar')}
      </button>

      <Link
        href={`https://wa.me/971556061134?text=${encodeURIComponent(whatsappText)}`}
        target="_blank"
        className="rounded-xl py-2 px-3 flex justify-center items-center gap-2 cursor-pointer bg-[#10B9811A] border border-[#10B98180] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all"
      >
        <IconWhatsapp className="size-5" />
      </Link>
    </div>
  );
}
