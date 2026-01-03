'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Components
import { DateBox } from '@/components/DateBox';
import DescriptionPopup from '@/components/DescriptionPopup';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { IconInfoCircle, IconRefresh } from '@/components/Icons';
import InformationStep from '@/components/InformationStep';
import PopupReels from '@/components/PopupReels';
import RoadMap from '@/components/RoadMap';
import { SearchBox } from '@/components/SearchBox';
import SearchFilterPopup from '@/components/SearchFilterPopup';
import SearchPopup from '@/components/SearchPopup';
import SingleCar from '@/components/SingleCar';
import SkeletonSingleCar from '@/components/SkeletonSingleCar';

// Redux & Utils
import { api } from '@/lib/apiClient';
import { addCarList, clearCarList, selectCar } from '@/redux/slices/carListSlice';
import { changeCarDates, changeRoadMapStep } from '@/redux/slices/globalSlice';
import { changePriceRange, changeSearchCurrency, changeSearchTitle, changeSelectedCategories, changeSort } from '@/redux/slices/searchSlice';

export default function SearchResultPage() {
   const dispatch = useDispatch();
   const t = useTranslations();
   const locale = useLocale();
   const searchParams = useSearchParams();
   const router = useRouter();
   const pathname = usePathname();

   // -- Redux State --
   const carList = useSelector((state) => state.carList.carList);
   const roadMapStep = useSelector((state) => state.global.roadMapStep);
   const isReelActive = useSelector((state) => state.reels.isReelActive);
   const isSearchOpen = useSelector((state) => state.global.isSearchOpen);
   const isFilterOpen = useSelector((state) => state.global.isFilterOpen);
   const descriptionPopup = useSelector((state) => state.global.descriptionPopup);
   const carDates = useSelector((state) => state.global.carDates);

   // Filters
   const filterSort = useSelector((state) => state.search.sort);
   const filterCats = useSelector((state) => state.search.selectedCategories);
   const filterPrice = useSelector((state) => state.search.selectedPriceRange);
   const filterTitle = useSelector((state) => state.search.search_title);
   const branchId = useSelector((state) => state.search.branch_id);

   // -- Local State --
   const [isLoading, setIsLoading] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false); // Scroll Loading
   const [error, setError] = useState(null);
   const [hasMore, setHasMore] = useState(true);
   const [page, setPage] = useState(1);
   const [isMounted, setIsMounted] = useState(false);

   // Refs
   const observerRef = useRef(null);
   const isLoadingRef = useRef(false);

   // 1. Initial Hydration
   useEffect(() => {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const cats = searchParams.get('categories');
      const stepParam = searchParams.get('step');
      const carIdParam = searchParams.get('car_id');
      const sortParam = searchParams.get('sort');
      const searchTitleParam = searchParams.get('search_title');

      if (from && to) dispatch(changeCarDates([from, to]));

      if (cats) {
         const catArray = cats.split(',').map(Number);
         dispatch(changeSelectedCategories(catArray));
      }

      if (sortParam) dispatch(changeSort(sortParam));
      if (searchTitleParam) dispatch(changeSearchTitle(searchTitleParam));

      if (stepParam && carIdParam) {
         dispatch(changeRoadMapStep(Number(stepParam)));
         dispatch(selectCar(Number(carIdParam)));
      } else {
         dispatch(changeRoadMapStep(1));
      }

      setIsMounted(true);
   }, []);

   // 2. Sync Redux -> URL & Fetch
   useEffect(() => {
      if (!isMounted || roadMapStep !== 1) return;

      // Reset Logic
      dispatch(clearCarList());
      setPage(1);
      setHasMore(true);
      setIsLoading(true); // Force skeleton

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      if (filterSort) params.set('sort', filterSort);
      else params.delete('sort');
      if (filterTitle) params.set('search_title', filterTitle);
      else params.delete('search_title');
      if (filterCats && filterCats.length > 0) params.set('categories', filterCats.join(','));
      else params.delete('categories');
      if (filterPrice && filterPrice.length === 2) {
         params.set('min_p', Math.min(...filterPrice));
         params.set('max_p', Math.max(...filterPrice));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Trigger Fetch
      fetchCars(false);
   }, [filterSort, filterCats, filterPrice, filterTitle, isMounted, roadMapStep]);

   // 3. Fetch Function
   const fetchCars = useCallback(
      async (isLoadMore = false) => {
         if (!carDates || !carDates[0] || !carDates[1]) {
            setIsLoading(false);
            return;
         }

         if (isLoadingRef.current) return;
         isLoadingRef.current = true;

         const currentPage = isLoadMore ? page + 1 : 1;

         if (!isLoadMore) {
            setIsLoading(true);
         } else {
            setIsLoadingMore(true);
         }

         setError(null);

         const bodyData = {
            branch_id: branchId || '1',
            from: carDates[0],
            to: carDates[1],
            sort: filterSort || 'price_min',
            search_title: filterTitle || '',
            page: currentPage,
            min_p: filterPrice ? Math.min(...filterPrice) : '0',
            max_p: filterPrice ? Math.max(...filterPrice) : '50000',
            cat_id: filterCats || [],
         };

         try {
            const response = await api.post(`/car/filter/${locale}`, bodyData);

            if (response.status === 200) {
               const { cars, currency, min_price, max_price, count_cars } = response.data;

               dispatch(addCarList(cars));
               dispatch(changeSearchCurrency(currency));

               if (!isLoadMore && (!filterPrice || filterPrice.length === 0)) {
                  dispatch(changePriceRange([min_price, max_price]));
               }

               if (carList.length + cars.length >= count_cars || cars.length === 0) {
                  setHasMore(false);
               } else {
                  setHasMore(true);
                  setPage(currentPage);
               }
            } else {
               throw new Error('Invalid response status');
            }
         } catch (err) {
            console.error('Search Fetch Error:', err);
            if (!isLoadMore) setError(t('errorLoading') || 'خطا در بارگذاری');
         } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsLoadingMore(false);

         }
      },
      [carDates, branchId, filterSort, filterTitle, filterPrice, filterCats, page, carList.length, locale]
   );

   // 4. Infinite Scroll Observer
   const lastElementRef = useCallback(
      (node) => {
         if (isLoading || isLoadingMore) return;
         if (observerRef.current) observerRef.current.disconnect();

         observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
               fetchCars(true);
            }
         });

         if (node) observerRef.current.observe(node);
      },
      [isLoading, isLoadingMore, hasMore, fetchCars]
   );

   return (
      <>
         <Header shadowLess />

         <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm transition-all">
            <DateBox isSticky={true} />
         </div>

         <div className="sm:w-[90vw] max-w-[1336px] m-auto relative my-4 px-2">{(!searchParams.get('step') || searchParams.get('step') < 3) && <RoadMap step={Number(roadMapStep)} />}</div>

         {/* Step 1: List */}
         {roadMapStep === 1 && (
            <>
               <div className="sm:w-[90vw] max-w-[1336px] m-auto px-2">
                  <SearchBox searchDisable={isLoading && !isLoadingMore} />
               </div>

               <div className="md:w-[90vw] max-w-[1336px] m-auto relative min-h-[50vh] px-2 mt-4">
                  {/* Error State */}
                  {error && !isLoading && (
                     <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-100">
                        <IconInfoCircle size="48" />
                        <span className="mt-2 font-bold">{t('errorLoading')}</span>
                        <button onClick={() => fetchCars(false)} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors">
                           <IconRefresh />
                           {t('tryAgain')}
                        </button>
                     </div>
                  )}

                  <div className="flex flex-wrap sm:gap-4 gap-y-4">
                     {/* Real Cars */}
                     {!isLoading &&
                        carList.map((item, index) => {
                           if (carList.length === index + 1) {
                              return (
                                 <div ref={lastElementRef} key={`${item.id}-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full">
                                    <SingleCar data={item} />
                                 </div>
                              );
                           } else {
                              return (
                                 <div key={`${item.id}-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full">
                                    <SingleCar data={item} />
                                 </div>
                              );
                           }
                        })}

                     {/* Skeletons: Show on initial load OR load more */}
                     {(isLoading || isLoadingMore) &&
                        Array(6)
                           .fill(null)
                           .map((_, index) => (
                              <div key={`skeleton-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full">
                                 <SkeletonSingleCar singlePrice={true} />
                              </div>
                           ))}
                  </div>

                  {/* No Results */}
                  {!isLoading && !isLoadingMore && !error && carList.length === 0 && (
                     <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-2">
                        <IconInfoCircle size="40" className="opacity-30" />
                        <span>{t('noCarsFound')}</span>
                     </div>
                  )}
               </div>
            </>
         )}

         {/* Step 2: Booking */}
         {roadMapStep === 2 && (
            <div className="sm:w-[90vw] max-w-[1336px] m-auto px-2">
               <InformationStep />
            </div>
         )}

         {isReelActive && <PopupReels />}
         {isSearchOpen && <SearchPopup />}
         {isFilterOpen && <SearchFilterPopup />}
         {descriptionPopup.description && <DescriptionPopup />}

         <Footer />
      </>
   );
}
