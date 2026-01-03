'use client';

import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams } from 'next/navigation';
;
;
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Components
import BranchDescriotion, { BranchDescriotionSkeleton } from '@/components/BranchDescription';
import MoreTextSection, { MoreTextSectionSkeleton } from '@/components/BranchMoreTextSection';
import CarBrandSection from '@/components/CarBrandSection';
import CommentSection from '@/components/CommentSection';
import CommonQuestionSection from '@/components/CommonQuestionSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { IconArrow, IconInfoCircle, IconRefresh } from '@/components/Icons';
import { RecentBlogPosts } from '@/components/RecentBlogPosts';
import SearchBar from '@/components/SearchBar';
import { SearchBox } from '@/components/SearchBox';
import SearchFilterPopup from '@/components/SearchFilterPopup';
import SearchPopup from '@/components/SearchPopup';
import SingleCar from '@/components/SingleCar';
import SkeletonSingleCar from '@/components/SkeletonSingleCar';

// Redux & Utils
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { api } from '@/lib/apiClient';
import { addCarList, clearCarList } from '@/redux/slices/carListSlice';
import { changeHomeBlogs, changeSelectedCity } from '@/redux/slices/globalSlice';
import { changeSearchCurrency } from '@/redux/slices/searchSlice';

const MAX_AUTO_SCROLL = 5;
const CARS_PER_PAGE = 3;

export default function BranchPage() {
   const dispatch = useDispatch();
   const t = useTranslations();
   const locale = useLocale();
   const params = useParams();
   const cityName = params.cityName;

   // -- Redux State --
   const carList = useSelector((state) => state.carList.carList);
   const cities = useSelector((state) => state.global.cities);

   // Filter States
   const search_title = useSelector((state) => state.search.search_title);
   const search_sort = useSelector((state) => state.search.sort);
   const selectedCategories = useSelector((state) => state.search.selectedCategories);

   // UI States
   const isSearchOpen = useSelector((state) => state.global.isSearchOpen);
   const isFilterOpen = useSelector((state) => state.global.isFilterOpen);
   const homeBlogs = useSelector((state) => state.global.homeBlogs);

   // -- Local State --
   const [isLoading, setIsLoading] = useState(true); // Initial Load
   const [isLoadingMore, setIsLoadingMore] = useState(false); // Scroll Load
   const [error, setError] = useState(null);
   const [branchData, setBranchData] = useState(null);
   const [rules, setRules] = useState([]);
   const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);

   // -- Refs --
   const containerRef = useRef(null);
   const pageRef = useRef(1);
   const hasMoreRef = useRef(true);
   const isLoadingRef = useRef(false);
   const autoScrollCountRef = useRef(0);

   const isUnderLg = useMediaQuery('(max-width: 1023.9px)');
   const branchId = cities[cityName];

   // -- 1. Reset & Fetch on Filters Change --
   useEffect(() => {
      // Reset Logic
      pageRef.current = 1;
      hasMoreRef.current = true;
      autoScrollCountRef.current = 0;
      setShowLoadMoreBtn(false);
      setIsLoading(true); // Force skeleton view
      setError(null);

      dispatch(clearCarList());

      // Trigger Fetch
      fetchData(1, true);
   }, [search_title, search_sort, selectedCategories, branchId]);

   // -- 2. Fetch Function --
   const fetchData = async (page = 1, isReset = false) => {
      if (!branchId) return;
      // Prevent duplicate calls if already loading (unless it's a reset/force load)
      if (isLoadingRef.current && !isReset) return;

      isLoadingRef.current = true;

      // Update UI States
      if (isReset) {
         setIsLoading(true);
      } else {
         setIsLoadingMore(true);
      }

      ;

      try {
         const queryParams = new URLSearchParams();
         if (search_title) queryParams.append('search_title', search_title);
         if (search_sort) queryParams.append('sort', search_sort);
         queryParams.append('page', page);
         queryParams.append('per_page', CARS_PER_PAGE);

         if (selectedCategories && selectedCategories.length > 0) {
            selectedCategories.forEach((id) => {
               queryParams.append('cat_id[]', id);
            });
         }

         const queryString = queryParams.toString();
         const url = `/car/branch/${branchId}/${locale}?${queryString}`;

         const response = await api.get(url);

         if (response.status === 200) {
            const data = response.data;

            if (!isReset) {
               autoScrollCountRef.current += 1;
            }

            dispatch(addCarList(data.cars));

            // Pagination Logic
            if (data.cars.length < CARS_PER_PAGE || data.cars.length === 0) {
               hasMoreRef.current = false;
               setShowLoadMoreBtn(false);
            } else {
               pageRef.current = page + 1;

               if (autoScrollCountRef.current >= MAX_AUTO_SCROLL) {
                  setShowLoadMoreBtn(true);
               } else {
                  setShowLoadMoreBtn(false);
               }
            }

            // Initial Data Population
            if (isReset) {
               setBranchData(data.branch);
               dispatch(changeSearchCurrency(data.currency));
               if (data.blogs) dispatch(changeHomeBlogs(data.blogs));
               if (data.faqs) {
                  const mappedFaqs = data.faqs.map((f) => ({ q: f.title, a: f.text }));
                  setRules(mappedFaqs);
               }
            }
         } else {
            throw new Error('Failed to fetch data');
         }
      } catch (err) {
         console.error('Fetch Error:', err);
         if (isReset) setError('خطا در دریافت اطلاعات. لطفا مجدد تلاش کنید.');
      } finally {
         isLoadingRef.current = false;
         setIsLoading(false);
         setIsLoadingMore(false);
         ;

         if (isReset) {
            dispatch(changeSelectedCity({ id: branchId, title: t(cityName) }));
         }
      }
   };

   // -- 3. Scroll Listener --
   useEffect(() => {
      const handleScroll = () => {
         if (showLoadMoreBtn || isLoading || error) return;
         if (!containerRef.current) return;

         const { bottom } = containerRef.current.getBoundingClientRect();
         const windowHeight = window.innerHeight;

         // Trigger fetch when near bottom
         if (bottom - windowHeight <= 300 && hasMoreRef.current && !isLoadingRef.current) {
            fetchData(pageRef.current, false);
         }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, [showLoadMoreBtn, isLoading, error]);

   const handleManualLoadMore = () => {
      autoScrollCountRef.current = 0;
      setShowLoadMoreBtn(false);
      fetchData(pageRef.current, false);
   };

   return (
      <>
         <Header />

         <div className="xl:w-[85vw] w-[95vw] max-w-[1336px] block m-auto min-h-screen">
            <div>
               {!isUnderLg && <Image className="object-contain" src={'/images/search-bg.png'} height={320} width={1440} alt="search background" priority />}
               <div className="lg:-mt-[120px] mt-8">
                  <SearchBar />
               </div>
            </div>

            {branchData ? <BranchDescriotion data={branchData} /> : !error && <BranchDescriotionSkeleton />}

            <CarBrandSection />

            <div id="search-section" className="my-8">
               <SearchBox />

               <div ref={containerRef} className="flex flex-wrap gap-4 mt-6 min-h-[300px]">
                  {/* 1. Error State */}
                  {!isLoading && error && (
                     <div className="flex flex-col items-center justify-center w-full py-10 border border-red-100 bg-red-50 rounded-xl">
                        <p className="text-red-500 mb-4 font-bold">{error}</p>
                        <button onClick={() => fetchData(1, true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                           <IconRefresh /> تلاش مجدد
                        </button>
                     </div>
                  )}

                  {/* 2. Loading State (Full Page Skeleton) */}
                  {isLoading &&
                     !error &&
                     Array(6)
                        .fill(null)
                        .map((_, index) => (
                           <div key={`init-skel-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full">
                              <SkeletonSingleCar singlePrice={true} />
                           </div>
                        ))}

                  {/* 3. Success State (Real Cars) */}
                  {!isLoading && !error && (
                     <>
                        {carList.map((item, index) => (
                           <div key={`${item.id}-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full animate-fade-in">
                              <SingleCar data={item} />
                           </div>
                        ))}

                        {/* 4. Load More Skeletons (Appended at bottom) */}
                        {isLoadingMore &&
                           Array(3)
                              .fill(null)
                              .map((_, index) => (
                                 <div key={`more-skel-${index}`} className="flex xl:w-[calc(33%-12px)] md:w-[calc(50%-8px)] w-full">
                                    <SkeletonSingleCar singlePrice={true} />
                                 </div>
                              ))}
                     </>
                  )}

                  {/* 5. Empty State */}
                  {!isLoading && !isLoadingMore && !error && carList.length === 0 && (
                     <div className="w-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <IconInfoCircle size="48" className="mb-2 opacity-50" />
                        <span>خودرویی با این مشخصات یافت نشد.</span>
                     </div>
                  )}

                  {/* 6. Manual Load Button */}
                  {!isLoading && !isLoadingMore && showLoadMoreBtn && (
                     <div className="w-full flex justify-center py-6">
                        <button onClick={handleManualLoadMore} className="bg-white border-2 border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-all font-bold py-3 px-8 rounded-xl flex items-center gap-2">
                           <span>مشاهده بیشتر</span>
                           <IconArrow className="rotate-90 size-3" />
                        </button>
                     </div>
                  )}
               </div>
            </div>

            <CommentSection />
            {rules.length > 0 && <CommonQuestionSection rules={rules} setRules={setRules} />}
            {homeBlogs && homeBlogs.length > 0 && <RecentBlogPosts />}
            {branchData ? <MoreTextSection data={branchData} /> : <MoreTextSectionSkeleton />}
         </div>

         {isSearchOpen && <SearchPopup />}
         {isFilterOpen && <SearchFilterPopup />}

         <Footer />
      </>
   );
}
