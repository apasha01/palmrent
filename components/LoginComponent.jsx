'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions
import { showToast } from '@/redux/slices/globalSlice';
import { changeIsStage2, changePhoneNumber, setError, setLoading } from '@/redux/slices/loginSlice';

// Utils & API
import { api } from '@/lib/apiClient';
import { removeLeadingZero } from '@/lib/removeLeadingZero';

/**
 * Main Container for Login Page
 */
export default function LoginComponent() {
   const isStage2 = useSelector((state) => state.login.isStage2);

   return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#F6F6F6]">
         <LoginBox>{!isStage2 ? <LoginStage1 /> : <LoginStage2 />}</LoginBox>
      </div>
   );
}

/**
 * Wrapper Component for Login UI
 */
export function LoginBox({ children }) {
   return (
      <div className="rounded-4xl bg-[#FFFFFF] flex p-8 flex-col gap-4 w-[487px] shadow-lg">
         <Link className="w-full flex justify-center" href="/">
            <Image className="filter-[invert(1)]" src="/images/logo.png" width={170} height={76} alt="Palm Rent Logo" />
         </Link>

         {children}

         <div className="flex justify-center gap-2 text-xs text-gray-500 mt-4">
            <Link className="text-[#1E40AF] hover:underline" href="/rules">
               قوانین و مقررات
            </Link>
            و
            <Link className="text-[#1E40AF] hover:underline" href="/privacy">
               حریم خصوصی
            </Link>
         </div>
      </div>
   );
}

/**
 * Stage 1: Enter Phone Number
 */
export function LoginStage1() {
   const dispatch = useDispatch();
   const phoneNumber = useSelector((state) => state.login.phoneNumber);
   const isLoading = useSelector((state) => state.login.isLoading);
   const error = useSelector((state) => state.login.error);
   const [isPhoneValid, setIsPhoneValid] = useState(false);

   // Validate Iranian Phone Number
   function isValidIranianPhoneNumber(phone) {
      if (!phone) return false;
      const cleaned = phone.toString().replace(/[\s\-\(\)\.]/g, '');
      // Allow formats: 0912..., 912...
      const patterns = [
         /^9\d{9}$/, // 912...
         /^09\d{9}$/, // 0912...
      ];
      return patterns.some((pattern) => pattern.test(cleaned));
   }

   // Handle Input Change
   function inputHandler(value) {
      // Only allow digits
      if (value && !/^\d+$/.test(value)) return;

      dispatch(changePhoneNumber(value));
      dispatch(setError(null)); // Clear errors on typing
      setIsPhoneValid(isValidIranianPhoneNumber(value));
   }

   // Submit Phone Number
   async function submitHandler() {
      if (!isPhoneValid) return;

      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
         const response = await api.post('/login/post/1', {
            mobile: removeLeadingZero(phoneNumber),
         });

         // Handle Success
         if (response.status === 200) {
            dispatch(changeIsStage2(true));
            // Optional: Show success toast
            dispatch(showToast({ message: 'کد تایید ارسال شد', type: 'success' }));
         }
         // Handle Specific "User Not Found" or other API errors
         else {
            const errorMsg = response.message || 'خطایی رخ داده است.';
            dispatch(setError(errorMsg));

            // Show Error Toast
            dispatch(showToast({ message: errorMsg, type: 'error' }));
         }
      } catch (err) {
         console.error('Login Error:', err);
         const errorMsg = 'خطا در برقراری ارتباط با سرور';
         dispatch(setError(errorMsg));

         // Show Network Error Toast
         dispatch(showToast({ message: errorMsg, type: 'error' }));
      } finally {
         dispatch(setLoading(false));
      }
   }

   return (
      <form
         onSubmit={(e) => {
            e.preventDefault();
            submitHandler();
         }}
         className="text-[#1A1A1A] flex flex-col gap-4"
      >
         <div className="text-xl font-bold text-center">ورود به حساب کاربری</div>
         <div className="text-xs text-gray-500 text-center">لطفا برای ورود به حساب کاربری خود شماره موبایل خود را وارد نمایید.</div>

         <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">شماره موبایل</span>
            <div className={`border flex flex-row-reverse border-[#B0B0B0] rounded-xl overflow-hidden focus-within:border-[#3B82F6] transition-colors ${error ? 'border-red-500' : ''}`}>
               <div dir="ltr" className="bg-gray-50 p-3 text-gray-500 border-r border-[#B0B0B0]">
                  +98
               </div>
               <input dir="ltr" maxLength={11} value={phoneNumber} onChange={(e) => inputHandler(e.target.value)} className="text-left w-full outline-0 p-3 text-lg" placeholder="9123456789" type="tel" autoFocus />
            </div>
            {error && <span className="text-red-500 text-xs">{error}</span>}
         </div>

         <button disabled={!isPhoneValid || isLoading} type="submit" className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white h-[52px] rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md shadow-blue-200">
            {isLoading ? (
               <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  در حال ارسال...
               </span>
            ) : (
               'دریافت کد تایید'
            )}
         </button>
      </form>
   );
}

/**
 * Stage 2: Verify Code (OTP)
 */
export function LoginStage2() {
   const dispatch = useDispatch();
   const router = useRouter();
   const phoneNumber = useSelector((state) => state.login.phoneNumber);
   const isLoading = useSelector((state) => state.login.isLoading);
   const [otp, setOtp] = useState(['', '', '', '', '']);
   const inputRefs = useRef([]);
   const [timer, setTimer] = useState(120); // 2 minutes timer

   // Handle Timer
   useEffect(() => {
      if (timer > 0) {
         const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
         return () => clearInterval(interval);
      }
   }, [timer]);

   // Format Timer
   const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
   };

   // Handle OTP Input
   const handleOtpChange = (index, value) => {
      if (value.length > 1) return; // Prevent multi-char input
      if (value && !/^\d+$/.test(value)) return; // Only numbers

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 4) {
         inputRefs.current[index + 1].focus();
      }
   };

   const handleKeyDown = (index, e) => {
      // Handle Backspace
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
         inputRefs.current[index - 1].focus();
      }
   };

   // Submit Verification Code
   async function verifyHandler() {
      const code = otp.join('');
      if (code.length !== 5) return;

      dispatch(setLoading(true));

      try {
         // API Call: Verify Code
         const response = await api.post('/login/post/2', {
            mobile: removeLeadingZero(phoneNumber),
            verify_code: code,
         });

         if (response.status === 200) {
            // Success: Redirect to Panel
            // Note: The backend sets the HttpOnly cookie, so we just redirect.
            router.push('/panel');
         } else {
            alert(response.message || 'کد وارد شده صحیح نیست.');
            setOtp(['', '', '', '', '']); // Clear inputs
            inputRefs.current[0].focus();
         }
      } catch (err) {
         console.error('Verification Error:', err);
         alert('خطا در تایید کد.');
      } finally {
         dispatch(setLoading(false));
      }
   }

   // Auto submit when 5 digits filled
   useEffect(() => {
      if (otp.join('').length === 5) {
         verifyHandler();
      }
   }, [otp]);

   return (
      <div className="text-[#1A1A1A] flex flex-col gap-6">
         <div className="flex flex-col items-center gap-1">
            <h2 className="text-xl font-bold">کد تایید را وارد کنید</h2>
            <div className="text-xs text-gray-500">
               کد تایید برای شماره <span className="font-bold text-black dir-ltr">{phoneNumber}</span> پیامک شد.
            </div>
            <button onClick={() => dispatch(changeIsStage2(false))} className="text-xs text-[#3B82F6] cursor-pointer mt-1 hover:underline">
               ویرایش شماره موبایل
            </button>
         </div>

         <div className="flex justify-center gap-3 flex-row-reverse" dir="ltr">
            {otp.map((digit, index) => (
               <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} className="w-12 h-12 border border-gray-300 rounded-lg text-center text-2xl focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 outline-none transition-all" inputMode="numeric" autoFocus={index === 0} />
            ))}
         </div>

         <div className="flex flex-col gap-3">
            <button disabled={otp.join('').length !== 5 || isLoading} onClick={verifyHandler} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white h-[52px] rounded-lg flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200">
               {isLoading ? 'در حال بررسی...' : 'تایید و ورود'}
            </button>

            <div className="text-center text-sm">
               {timer > 0 ? (
                  <span className="text-gray-500">ارسال مجدد کد تا {formatTime(timer)} دیگر</span>
               ) : (
                  <button
                     onClick={() => {
                        setTimer(120); /* Logic to resend SMS needed here if API supports it */
                     }}
                     className="text-[#3B82F6] font-bold hover:underline cursor-pointer"
                  >
                     ارسال مجدد کد
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
