'use client';

import useDisableScroll from '@/hooks/useDisableScroll';
import { changeIsInfoListOpen } from '@/redux/slices/globalSlice';
import { useTranslations } from 'next-intl';
import { useDispatch } from 'react-redux';
import { IconClose, IconPerson } from './Icons';

export default function InfoListPopup({ onSelect }) {
   // Added onSelect prop
   const dispatch = useDispatch();
   const t = useTranslations();

   // Disable background scrolling
   useDisableScroll();

   function closePopup() {
      dispatch(changeIsInfoListOpen(false));
   }

   // Mock Data for User List
   // Replace this with real API call in production
   const users = [{ id: 1, name: 'کاربر مهمان', phone: '971000000000', email: 'guest@example.com' }];

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
         {/* Backdrop */}
         <div onClick={closePopup} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-opacity cursor-pointer"></div>

         {/* Modal Container */}
         <div className="relative bg-white z-[101] rounded-2xl w-[90%] md:w-[400px] shadow-2xl animate-fade-in2 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="w-full border-b border-gray-100 p-4 flex justify-between items-center bg-gray-50">
               <span className="font-bold text-gray-800 text-sm">{t('chooseInfoTitle')}</span>
               <button onClick={closePopup} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                  <IconClose className="size-4 text-gray-600" />
               </button>
            </div>

            {/* List Content */}
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
               {users.length > 0 ? (
                  users.map((u, i) => (
                     <div
                        key={i}
                        onClick={() => {
                           if (onSelect) onSelect(u); // Pass data back to parent
                           closePopup();
                        }}
                        className="bg-gray-50 text-gray-700 rounded-xl p-3 cursor-pointer border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center gap-3"
                     >
                        <div className="bg-white p-2 rounded-full border border-gray-100 shadow-sm">
                           <IconPerson className="size-5 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-bold text-sm text-gray-800">{u.name}</span>
                           <span className="text-xs text-gray-500">{u.phone}</span>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
                     <IconPerson className="size-10 opacity-20" />
                     <span>اطلاعاتی یافت نشد</span>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
