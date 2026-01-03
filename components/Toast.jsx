'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '@/redux/slices/globalSlice';
import { IconClose, IconInfo, IconTick2, IconClose as IconError, IconInfoCircle } from './Icons';

/**
 * Modern Toast Notification Component
 * Positioned top-right with slide-in animation
 */
export default function Toast() {
   const dispatch = useDispatch();
   const { show, message, type } = useSelector((state) => state.global.toast);
   const [isExiting, setIsExiting] = useState(false);

   // Configuration for different toast types
   const config = {
      success: {
         icon: <IconTick2 className="w-6 h-6" />, // Assuming IconTick2 exists and is suitable
         colorClass: 'border-green-500 text-green-600',
         bgClass: 'bg-green-50',
         progressClass: 'bg-green-500',
      },
      error: {
         icon: <IconError className="w-6 h-6" />, // Using Close icon as error or import a warning icon
         colorClass: 'border-red-500 text-red-600',
         bgClass: 'bg-red-50',
         progressClass: 'bg-red-500',
      },
      warning: {
         icon: <IconInfoCircle className="w-6 h-6" />,
         colorClass: 'border-yellow-500 text-yellow-600',
         bgClass: 'bg-yellow-50',
         progressClass: 'bg-yellow-500',
      },
      info: {
         icon: <IconInfo className="w-6 h-6" />,
         colorClass: 'border-blue-500 text-blue-600',
         bgClass: 'bg-blue-50',
         progressClass: 'bg-blue-500',
      },
   };

   const currentConfig = config[type] || config.info;

   // Handle closing with animation
   const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => {
         dispatch(hideToast());
         setIsExiting(false);
      }, 300); // Wait for exit animation
   };

   // Auto-hide logic
   useEffect(() => {
      if (show) {
         const timer = setTimeout(() => {
            handleClose();
         }, 4000);
         return () => clearTimeout(timer);
      }
   }, [show]);

   if (!show) return null;

   return (
      <div
         className={`
        fixed top-8 right-8 z-[9999]
        flex items-stretch overflow-hidden
        min-w-[320px] max-w-[400px]
        bg-white/95 backdrop-blur-md
        rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border-r-4 ${currentConfig.colorClass.split(' ')[0]}
        transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-fromRight'}
      `}
         dir="rtl" // Force RTL layout for content
      >
         {/* Icon Section */}
         <div className={`flex items-center justify-center px-4 ${currentConfig.bgClass}`}>
            <span className={`${currentConfig.colorClass.split(' ')[1]}`}>{currentConfig.icon}</span>
         </div>

         {/* Content Section */}
         <div className="flex-1 py-4 px-3 flex flex-col justify-center">
            <h4 className={`text-sm font-bold ${currentConfig.colorClass.split(' ')[1]}`}>{type === 'success' ? 'موفق' : type === 'error' ? 'خطا' : 'پیام'}</h4>
            <p className="text-gray-600 text-xs mt-1 font-medium leading-5">{message}</p>
         </div>

         {/* Close Button */}
         <button onClick={handleClose} className="px-3 text-gray-400 hover:text-gray-600 transition-colors flex items-start pt-4">
            <IconClose className="w-4 h-4" />
         </button>

         {/* Progress Bar (Timer) */}
         <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gray-100">
            <div className={`h-full ${currentConfig.progressClass} animate-progress-shrink`} style={{ animationDuration: '4000ms' }} />
         </div>
      </div>
   );
}
