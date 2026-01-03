import useDisableScroll from '@/hooks/useDisableScroll';
import { dateDifference } from '@/lib/getDateDiffrence';
import { changeIsDateSelectOpen } from '@/redux/slices/globalSlice';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconCalender, IconClock, IconSearch3, IconVideoTime } from './Icons';
import { DatePickerBox } from './SearchBar';

function formatJalaaliDate(dateString) {
   if (!dateString || typeof dateString !== 'string') return '---';

   try {
      let year, month, day;

      const cleanDate = dateString.replace(/-/g, '/');
      const parts = cleanDate.split('/');

      if (parts.length !== 3) return dateString;

      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);

      if (isNaN(year) || isNaN(month) || isNaN(day)) return '---';

      const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

      if (year > 1900) {
      }

      if (month >= 1 && month <= 12) {
         return `${day} ${monthNames[month - 1]} ${year}`;
      }

      return dateString;
   } catch (err) {
      return '---';
   }
}

export function DateBox({ isSticky = false, timerValue }) {
   const isHeaderClose = useSelector((state) => state.global.isHeaderClose);
   const carDates = useSelector((state) => state.global.carDates);
   const returnTime = useSelector((state) => state.global.returnTime);
   const deliveryTime = useSelector((state) => state.global.deliveryTime);
   const isDateSelectOpen = useSelector((state) => state.global.isDateSelectOpen);
   const [carDayCount, setCarDayCount] = useState(0);
   const t = useTranslations();
   const dispatch = useDispatch();

   useEffect(() => {
      if (carDates && carDates[0] && carDates[1]) {
         try {
            if (carDates[0].includes('NaN') || carDates[1].includes('NaN')) {
               setCarDayCount(0);
               return;
            }
            const diff = dateDifference(carDates[0], carDates[1]);
            setCarDayCount(diff.days || 0);
         } catch (e) {
            setCarDayCount(0);
         }
      } else {
         setCarDayCount(0);
      }
   }, [carDates]);

   function openDateSelect() {
      dispatch(changeIsDateSelectOpen(true));
   }

   const startDateDisplay = carDates && carDates[0] ? formatJalaaliDate(carDates[0]) : '---';
   const endDateDisplay = carDates && carDates[1] ? formatJalaaliDate(carDates[1]) : '---';

   return (
      <>
         <div className={`${isSticky ? 'sticky mb-10' : ''} ${isHeaderClose ? 'top-0' : 'top-16'} transition-all z-30 w-full p-4 py-4 bg-white text-xs items-center justify-center gap-2 md:gap-0 border-b border-gray-100 shadow-sm`}>
            <div className="lg:w-[90vw] md:w-[90vw] max-w-[1200px] m-auto flex items-center">
               <div className="w-full flex lg:flex-row flex-col items-center sm:gap-0 gap-2 md:justify-between justify-center text-nowrap font-bold">
                  <div className="flex xl:w-2/3 w-full max-[400px]:gap-2 gap-4 gap-y-1 text-[#1A1A1A] max-[380px]:flex-wrap justify-center lg:justify-start">
                     <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 text-gray-500">
                           <span className="max-sm:hidden">
                              <IconCalender />
                           </span>
                           <span className="xl:block hidden">{t('deliveryTD')}</span>
                           <span className="xl:hidden block">{t('from')}</span>
                        </span>
                        <span onClick={openDateSelect} className="flex gap-1 items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                           <div className="min-w-[80px] text-center">{startDateDisplay}</div>
                           <span className="text-gray-400">|</span>
                           <div>{deliveryTime}</div>
                        </span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="flex items-center gap-2 text-gray-500">
                           <span className="sm:flex hidden">
                              <IconCalender />
                           </span>
                           <span className="xl:block hidden">{t('returnTD')}</span>
                           <span className="xl:hidden block">{t('to')}</span>
                        </span>
                        <span onClick={openDateSelect} className="flex gap-1 items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                           <div className="min-w-[80px] text-center">{endDateDisplay}</div>
                           <span className="text-gray-400">|</span>
                           <div>{returnTime}</div>
                        </span>
                     </div>
                  </div>

                  <div className="items-center xl:w-1/3 w-full gap-2 flex justify-center lg:justify-end text-[#6c7680] sm:text-xs text-[10px]">
                     <span className="flex items-center gap-2">
                        <span className="max-sm:hidden">
                           <IconVideoTime />
                        </span>
                        {t('rentDurationB')}
                     </span>
                     <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                        {carDayCount} {t('day')}
                     </span>
                     <span>
                        {t('rentDurationA')} {t('dubai')}
                     </span>
                  </div>
               </div>

               <button onClick={openDateSelect} className="sm:bg-transparent bg-[#3B82F6] size-9 rounded-full text-white flex items-center justify-center text-nowrap gap-2 cursor-pointer rtl:mr-4 ltr:ml-4 shrink-0 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <IconSearch3 size="20" />
                  <span className="sm:flex hidden text-[#3B82F6] font-bold">{t('changeSearch')}</span>
               </button>

               {timerValue && (
                  <div className="text-red-500 flex items-center gap-1 lg:flex hidden rtl:mr-4 ltr:ml-4 bg-red-50 px-3 py-1 rounded-full font-mono font-bold">
                     {timerValue}
                     <span className="size-5 flex items-center">
                        <IconClock />
                     </span>
                  </div>
               )}
            </div>
         </div>
         {isDateSelectOpen && <DatePopup />}
      </>
   );
}

export function DatePopup() {
   useDisableScroll();
   const dispatch = useDispatch();
   function closeDateSelect() {
      dispatch(changeIsDateSelectOpen(false));
   }
   return (
      <div className="fixed w-screen h-[100vw] top-0 right-0 z-50">
         <div className="animate-opacity">
            <div onClick={closeDateSelect} className="absolute top-0 right-0 w-full h-full bg-black opacity-60 backdrop-blur-sm"></div>
         </div>
         <DatePickerBox isPopup={true} />
      </div>
   );
}
