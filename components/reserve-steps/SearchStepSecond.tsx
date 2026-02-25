// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";

// import * as React from "react";
// import { JSX, useEffect, useMemo, useRef, useState } from "react";
// import { useLocale, useTranslations } from "next-intl";
// import jalaali from "jalaali-js";
// import Image from "next/image";
// import { Link } from "@/i18n/navigation";
// import { useSearchParams, useRouter } from "@/i18n/navigation";
// import { PhoneInput } from "react-international-phone";
// import "react-international-phone/style.css";
// import { Info, UserSearch, Coins } from "lucide-react";
// import { api } from "@/lib/apiClient";
// import { toast } from "react-toastify";
// import { STORAGE_URL } from "../../lib/apiClient";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days";

// import type {
//   ApiCalcResponse,
//   LocationState,
//   Totals,
//   UserInfo,
// } from "@/types/rent-information";

// import { InformationStepSkeleton } from "../Loadings/InformationSetupSkeleton";
// import InfoListDialog from "../InfoListPopup";
// import ResponsiveLocationPicker from "../search/extra/ResponsiveLocationPicker";

// import {
//   ExtrasList,
//   formatMoneyOrFree,
//   formatNum,
//   SelectedCarMeta,
// } from "../search/helpers/utils";

// import { Switch } from "../ui/switch";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// // ✅ مهم: برای موبایل که car_id از URL حذف میشه، از store بخونیم
// import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";
// import { PriceGroupsResponsive } from "../search/extra/PriceGroupsResponsive";
// import SummaryRow from "../search/extra/SummarySection";
// import { signIn, signOut, useSession } from "next-auth/react";

// // ✅ NEW: Meta client
// import SearchMetaClient from "@/services/seo/SearchMetaClient";
// import { getBranchNameById } from "@/helpers/BranchNameHelper";

// // ✅ cache & inflight (key باید dt/rt داشته باشه)
// const calcCache = new Map<string, ApiCalcResponse>();
// const calcInflight = new Map<string, Promise<ApiCalcResponse>>();

// function oneLine(s: any) {
//   return String(s ?? "").replace(/\s+/g, " ").trim();
// }

// function shortAddr(s: any, max = 50) {
//   const x = oneLine(s);
//   if (!x) return "";
//   return x.length > max ? x.slice(0, max) + "…" : x;
// }

// function safeNum(v: any, fallback = 0): number {
//   const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
//   return Number.isFinite(n) ? n : fallback;
// }

// function clamp(n: number, min: number, max: number) {
//   return Math.min(max, Math.max(min, n));
// }

// /**
//  * ✅ استخراج امن تخفیف/قیمت از API
//  */
// function useRentPricing(apiData: ApiCalcResponse | null, rentDays: number) {
//   return useMemo(() => {
//     const item: any = apiData?.item || {};

//     const offPercent = clamp(safeNum(item.off, 0), 0, 100);

//     const dailyAfter =
//       safeNum(item.rent_price_day_after_discount, 0) ||
//       safeNum(item.rent_price_day, 0) ||
//       safeNum(item.final_price, 0) ||
//       0;

//     const dailyBefore =
//       safeNum(item.rent_price_day_before_discount, 0) ||
//       safeNum(item.rent_price, 0) ||
//       (offPercent > 0 && dailyAfter > 0
//         ? dailyAfter / (1 - offPercent / 100)
//         : dailyAfter);

//     const totalAfter =
//       safeNum(item.rent_total_after_discount, 0) ||
//       safeNum(item.pay_price, 0) ||
//       dailyAfter * (rentDays || 1);

//     const totalBefore =
//       safeNum(item.rent_total_before_discount, 0) ||
//       dailyBefore * (rentDays || 1);

//     return {
//       offPercent,
//       dailyBefore,
//       dailyAfter,
//       totalBefore,
//       totalAfter,
//     };
//   }, [apiData, rentDays]);
// }

// export default function InformationStep(): JSX.Element {
//   // ✅ Namespace
//   const t = useTranslations("InformationStep");
//   const locale = useLocale();
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   // ✅ car_id: اول URL، اگر نبود از store (برای موبایل + Sheet)
//   const storeSelectedCarId = useSearchPageStore((s) => s.selectedCarId);

//   const selectedCarId = useMemo(() => {
//     const urlId = searchParams.get("car_id");
//     if (urlId && urlId !== "null") return urlId;
//     if (storeSelectedCarId) return String(storeSelectedCarId);
//     return null;
//   }, [searchParams, storeSelectedCarId]);

//   const urlFrom = searchParams.get("from");
//   const urlTo = searchParams.get("to");

//   // ✅ dt/rt همیشه normalize بشن
//   const dt = normalizeTime(searchParams.get("dt") || "10:00");
//   const rt = normalizeTime(searchParams.get("rt") || "10:00");

//   const carDates = useMemo(() => {
//     return urlFrom && urlTo ? ([urlFrom, urlTo] as const) : null;
//   }, [urlFrom, urlTo]);

//   const branchIdFromUrl = useMemo(() => {
//     const raw = searchParams.get("branch_id");
//     if (!raw) return null;
//     const n = Number(raw);
//     if (!Number.isFinite(n) || n <= 0) return null;
//     return n;
//   }, [searchParams]);

//   // ==========================
//   // ✅✅✅ BranchName + RentDays + Dynamic Meta
//   // ==========================
//   const branchName = useMemo(() => {
//     return getBranchNameById(searchParams.get("branch_id"), "");
//   }, [searchParams]);

//   const rentDaysForTitle = useMemo(() => {
//     if (!urlFrom || !urlTo) return 0;
//     try {
//       return calcRentDaysWithGrace({
//         fromDateJalali: urlFrom,
//         toDateJalali: urlTo,
//         deliveryTime: dt || "10:00",
//         returnTime: rt || "10:00",
//         graceMinutes: 90,
//         jalaliToDate: (jy, jm, jd) => {
//           const g = jalaali.toGregorian(jy, jm + 1, jd);
//           return new Date(g.gy, g.gm - 1, g.gd);
//         },
//       });
//     } catch {
//       return 0;
//     }
//   }, [urlFrom, urlTo, dt, rt]);

//   // ===== Local UI State =====
//   const [deliveryLocation, setDeliveryLocation] = useState<LocationState>({
//     isDesired: false,
//     location: null,
//     address: "",
//   });
//   const [returnLocation, setReturnLocation] = useState<LocationState>({
//     isDesired: false,
//     location: null,
//     address: "",
//   });
//   const [returnDifferent, setReturnDifferent] = useState<boolean>(false);

//   const [isInfoListOpen, setIsInfoListOpen] = useState<boolean>(false);
//   const [apiData, setApiData] = useState<ApiCalcResponse | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
//   const [insuranceComplete, setInsuranceComplete] = useState<boolean>(false);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [userInfo, setUserInfo] = useState<UserInfo>({
//     name: "",
//     email: "",
//     phone: "",
//   });

//   // ✅✅✅ skeleton 1s فقط برای آیتمی که تغییر کرده
//   const [pendingSummaryIds, setPendingSummaryIds] = useState<
//     Record<number, boolean>
//   >({});
//   const pendingTimersRef = useRef<Record<number, any>>({});

//   function triggerSummarySkeleton(optionId: number, ms = 1000) {
//     const id = Number(optionId);
//     if (!Number.isFinite(id)) return;

//     if (pendingTimersRef.current[id]) {
//       clearTimeout(pendingTimersRef.current[id]);
//     }

//     setPendingSummaryIds((prev) => ({ ...prev, [id]: true }));

//     pendingTimersRef.current[id] = setTimeout(() => {
//       setPendingSummaryIds((prev) => {
//         const next = { ...prev };
//         delete next[id];
//         return next;
//       });
//       delete pendingTimersRef.current[id];
//     }, ms);
//   }

//   useEffect(() => {
//     return () => {
//       Object.values(pendingTimersRef.current).forEach((tt) => {
//         if (tt) clearTimeout(tt);
//       });
//       pendingTimersRef.current = {};
//     };
//   }, []);

//   const { data: session, status: sessionStatus } = useSession();

//   function normalizePhone(p: any) {
//     const s = String(p ?? "")
//       .replace(/[^\d+]/g, "")
//       .trim();
//     if (!s) return "";
//     if (s.startsWith("0098")) return "+98" + s.slice(4);
//     if (s.startsWith("098")) return "+98" + s.slice(3);
//     if (s.startsWith("98") && !s.startsWith("+98")) return "+98" + s.slice(2);
//     if (s.startsWith("0") && s.length === 11) return "+98" + s.slice(1);
//     return s;
//   }

//   useEffect(() => {
//     if (sessionStatus !== "authenticated") return;

//     const u: any = (session as any)?.user ?? {};

//     const fullName =
//       (u?.name && String(u.name).trim()) ||
//       [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
//       "";

//     const phoneRaw = u?.phone ?? u?.username ?? u?.mobile ?? "";
//     const phone = normalizePhone(phoneRaw);

//     const email = (u?.email && String(u.email).trim()) || "";

//     // ✅ فقط فیلدهای خالی رو پر کن (تایپ کاربر از بین نره)
//     setUserInfo((prev) => ({
//       name: prev.name?.trim() ? prev.name : fullName,
//       phone: prev.phone?.trim() ? prev.phone : phone,
//       email: prev.email?.trim() ? prev.email : email,
//     }));
//   }, [sessionStatus, session]);

//   // ✅ وقتی ماشین عوض شد، state های قیمت‌ساز رو reset کن تا قیمت “ارثی” نشه
//   const prevCarRef = useRef<string | null>(null);
//   useEffect(() => {
//     const cur =
//       selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null;
//     if (prevCarRef.current === null) {
//       prevCarRef.current = cur;
//       return;
//     }
//     if (prevCarRef.current !== cur) {
//       prevCarRef.current = cur;
//       setSelectedOptions([]);
//       setInsuranceComplete(false);
//       setDeliveryLocation({ isDesired: false, location: null, address: "" });
//       setReturnLocation({ isDesired: false, location: null, address: "" });
//       setReturnDifferent(false);
//     }
//   }, [selectedCarId]);

//   // ===== Fake Coupon Dialog =====
//   const [couponOpen, setCouponOpen] = useState(false);
//   const [couponCode, setCouponCode] = useState("");
//   const [couponState, setCouponState] = useState<
//     "idle" | "checking" | "invalid"
//   >("idle");
//   const couponTimerRef = useRef<any>(null);

//   useEffect(() => {
//     return () => {
//       if (couponTimerRef.current) clearTimeout(couponTimerRef.current);
//     };
//   }, []);

//   // ✅ fetchKey باید dt/rt داشته باشه وگرنه cache اشتباه میشه
//   const fetchKey = useMemo(() => {
//     const carId =
//       selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : "";
//     const branchId = branchIdFromUrl ? String(branchIdFromUrl) : "";
//     const from = urlFrom || "";
//     const to = urlTo || "";
//     const loc = locale || "";
//     return `${carId}|${branchId}|${from}|${to}|${loc}|${dt}|${rt}`;
//   }, [selectedCarId, branchIdFromUrl, urlFrom, urlTo, locale, dt, rt]);

//   const lastFetchKeyRef = useRef<string>("");

//   useEffect(() => {
//     const carIdRaw =
//       selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null;
//     const branchIdRaw =
//       branchIdFromUrl != null ? String(branchIdFromUrl) : null;

//     // ✅ مهم: اگر دیتاهای لازم نداریم، اسکلتون گیر نکنه
//     if (!carIdRaw || !branchIdRaw || !urlFrom || !urlTo) {
//       setIsLoading(false);
//       setApiData(null);
//       return;
//     }

//     if (lastFetchKeyRef.current === fetchKey) return;
//     lastFetchKeyRef.current = fetchKey;

//     let alive = true;

//     async function run() {
//       try {
//         const cached = calcCache.get(fetchKey);
//         if (cached) {
//           setApiData(cached);
//           setIsLoading(false);
//           return;
//         }

//         setIsLoading(true);

//         const inflight = calcInflight.get(fetchKey);
//         if (inflight) {
//           const data = await inflight;
//           if (!alive) return;
//           setApiData(data);
//           setIsLoading(false);
//           return;
//         }

//         const params = new URLSearchParams();
//         params.append("branch_id", String(branchIdRaw));
//         params.append("from", String(urlFrom));
//         params.append("to", String(urlTo));
//         params.append("dt", dt);
//         params.append("rt", rt);

//         const url = `/car/rent/${carIdRaw}/${locale}?${params.toString()}`;

//         const promise = (async () => {
//           const res: any = await api.get(url);
//           const payload = (res?.data ?? res) as ApiCalcResponse;
//           const status = res?.status ?? (payload as any)?.status;

//           if (status && Number(status) !== 200) {
//             throw new Error(
//               (payload as any)?.message || t("toast.fetchInfoError")
//             );
//           }
//           if (!payload?.item) throw new Error(t("toast.invalidServerResponse"));
//           return payload;
//         })();

//         calcInflight.set(fetchKey, promise);
//         const data = await promise;
//         calcInflight.delete(fetchKey);
//         calcCache.set(fetchKey, data);

//         if (!alive) return;
//         setApiData(data);
//       } catch (error: any) {
//         calcInflight.delete(fetchKey);
//         console.error("Calculation Error:", error);
//         toast.error(error?.message || t("toast.serverConnectionError"));
//       } finally {
//         if (alive) setIsLoading(false);
//       }
//     }

//     run();
//     return () => {
//       alive = false;
//     };
//   }, [
//     fetchKey,
//     selectedCarId,
//     urlFrom,
//     urlTo,
//     branchIdFromUrl,
//     locale,
//     dt,
//     rt,
//     t,
//   ]);

//   // ================== Places safe ==================
//   const activePlaces = useMemo(() => {
//     return Array.isArray(apiData?.places)
//       ? apiData!.places!.filter(Boolean)
//       : [];
//   }, [apiData]);

//   // ✅ currencyLabel
//   const currencyLabel = useMemo(() => {
//     const cur = (apiData as any)?.currency;
//     return cur ? t(`currency.${cur}`) : "";
//   }, [apiData, t]);

//   // ================== ✅ Options: hide zero-priced + hide section if empty ==================
//   const payableOptions = useMemo(() => {
//     const opts = Array.isArray((apiData as any)?.options)
//       ? (apiData as any).options.filter(Boolean)
//       : [];

//     return opts.filter((o: any) => {
//       const p = safeNum(o?.price, 0);
//       const pp = safeNum(o?.price_pay, 0);
//       return p > 0 || pp > 0;
//     });
//   }, [apiData]);

//   const canSelectInsuranceComplete = useMemo(() => {
//     return (
//       String((apiData?.item as any)?.insurance_complete_status || "no")
//         .toLowerCase() === "yes"
//     );
//   }, [apiData]);

//   const shouldShowExtrasSection = useMemo(() => {
//     return payableOptions.length > 0 || canSelectInsuranceComplete;
//   }, [payableOptions, canSelectInsuranceComplete]);

//   // ✅ پاکسازی انتخاب‌ها اگر آپشن صفر/حذف‌شده انتخاب شده باشد
//   useEffect(() => {
//     const allowed = new Set(payableOptions.map((o: any) => Number(o?.id)));
//     setSelectedOptions((prev) => prev.filter((id) => allowed.has(Number(id))));
//   }, [payableOptions]);

//   // ================== Totals ==================
//   const totals: Totals = useMemo(() => {
//     const safeTotals: Totals = {
//       total: 0,
//       prePay: 0,
//       debt: 0,
//       tax: 0,
//       rentDays: 0,
//       dailyPrice: 0,
//       extraItems: [],
//     };
//     if (!apiData?.item) return safeTotals;

//     let totalPrice = safeNum((apiData.item as any).pay_price, 0);
//     let prePayPrice = safeNum((apiData.item as any).pre_pay_price, 0);

//     // ✅ rentDays دقیق
//     let rentDays = 1;
//     try {
//       if (carDates?.length === 2) {
//         rentDays = calcRentDaysWithGrace({
//           fromDateJalali: carDates[0],
//           toDateJalali: carDates[1],
//           deliveryTime: dt,
//           returnTime: rt,
//           graceMinutes: 90,
//           jalaliToDate: (jy, jm, jd) => {
//             const g = jalaali.toGregorian(jy, jm + 1, jd);
//             return new Date(g.gy, g.gm - 1, g.gd);
//           },
//         });
//       }
//     } catch {
//       rentDays = safeNum((apiData.item as any).rent_days, 1);
//     }
//     rentDays = rentDays > 0 ? rentDays : 1;

//     // ✅ dailyPrice: ترجیحاً از سرور
//     const serverDaily =
//       safeNum((apiData.item as any).rent_price_day, 0) ||
//       safeNum((apiData.item as any).final_price, 0) ||
//       0;

//     const dailyPrice =
//       serverDaily > 0 ? serverDaily : totalPrice > 0 ? totalPrice / rentDays : 0;

//     const extraItems: {
//       optionId?: number;
//       title: string;
//       price: number;
//       subLabel?: React.ReactNode;
//     }[] = [];

//     // ✅ Options (فقط آپشن‌های غیر صفر)
//     {
//       const safeOptions = payableOptions as any[];

//       selectedOptions.forEach((optId) => {
//         const opt = safeOptions.find((o) => Number(o?.id) === Number(optId));
//         if (!opt) return;

//         const optPrice = safeNum((opt as any).price_pay, 0);
//         const preOpt = safeNum((opt as any).pre_price_pay, 0);

//         totalPrice += optPrice;
//         prePayPrice += preOpt;

//         const perDay = rentDays > 0 ? Math.round(optPrice / rentDays) : optPrice;

//         extraItems.push({
//           optionId: Number(optId),
//           title: (opt as any).title, // از API
//           price: optPrice,
//           subLabel: (
//             <span className="inline-flex items-center gap-1">
//               <span className="text-gray-500">{t("common.dailyPrice")}:</span>
//               <span className="text-gray-500">
//                 {formatNum(perDay)} {currencyLabel}
//               </span>
//             </span>
//           ),
//         });
//       });
//     }

//     // Insurance (complete)
//     if (insuranceComplete) {
//       const insPrice = safeNum(
//         (apiData.item as any).insurance_complete_price_pay,
//         0
//       );

//       const insPre = safeNum(
//         (apiData.item as any).pre_price_insurance_complete_price_pay,
//         0
//       );

//       totalPrice += insPrice;
//       prePayPrice += insPre;

//       const insuranceDailyFromApi = safeNum(
//         (apiData.item as any).insurance_complete_price,
//         0
//       );

//       const perDay =
//         insuranceDailyFromApi > 0
//           ? insuranceDailyFromApi
//           : rentDays > 0
//             ? Math.round(insPrice / rentDays)
//             : insPrice;

//       extraItems.push({
//         optionId: -999,
//         title: t("extras.insuranceCompleteTitle"),
//         price: insPrice,
//         subLabel: (
//           <span className="inline-flex items-center gap-1">
//             <span className="text-gray-500">
//               {formatNum(perDay)} {currencyLabel}
//             </span>
//             <span className="text-gray-500">{t("common.daily")}</span>
//           </span>
//         ),
//       });
//     }

//     // Places
//     if (Array.isArray(apiData.places)) {
//       const places = apiData.places.filter(Boolean);
//       const getPlaceById = (id: any) =>
//         places.find((p) => p && String((p as any).id) === String(id));

//       const isHotelField = (addressTitle: any) => {
//         const s = String(addressTitle ?? "").toLowerCase();
//         return s.includes("هتل") || s.includes("hotel");
//       };

//       const hotelSuffix = (placeObj: any, addr: any) => {
//         const a = oneLine(addr);
//         if (!a) return "";
//         const title = (placeObj as any)?.address_title;
//         if (!isHotelField(title)) return "";
//         return ` (${shortAddr(a, 35)})`;
//       };

//       // ---------- Delivery ----------
//       if (deliveryLocation?.location) {
//         const del = getPlaceById((deliveryLocation as any).location);
//         const delPrice = safeNum((del as any)?.price_pay, 0);
//         const delPre = safeNum((del as any)?.pre_price_pay, 0);

//         totalPrice += delPrice;
//         prePayPrice += delPre;

//         const delNeedAddr = String((del as any)?.need_address || "no") === "yes";
//         const delHotel = delNeedAddr
//           ? hotelSuffix(del, (deliveryLocation as any)?.address)
//           : "";

//         extraItems.push({
//           title: `${t("places.deliveryPrefix")}: ${(del as any)?.title || t("common.unknown")}${delHotel}`,
//           price: delPrice,
//         });
//       }

//       // ---------- Return ----------
//       const effectiveReturn = returnDifferent ? returnLocation : deliveryLocation;

//       if ((effectiveReturn as any)?.location) {
//         const ret = getPlaceById((effectiveReturn as any).location);
//         const retPrice = safeNum((ret as any)?.price_pay, 0);
//         const retPre = safeNum((ret as any)?.pre_price_pay, 0);

//         if (returnDifferent) {
//           totalPrice += retPrice;
//           prePayPrice += retPre;
//         }

//         const retNeedAddr = String((ret as any)?.need_address || "no") === "yes";

//         const retAddrValue = returnDifferent
//           ? (returnLocation as any)?.address
//           : (deliveryLocation as any)?.address;

//         const retHotel = retNeedAddr ? hotelSuffix(ret, retAddrValue) : "";

//         extraItems.push({
//           title: `${t("places.returnPrefix")}: ${(ret as any)?.title || t("common.unknown")}${retHotel}`,
//           price: retPrice,
//         });
//       }
//     }

//     // Tax
//     let tax = 0;
//     const taxPercent = safeNum((apiData.item as any).tax_percent, 0);
//     if (taxPercent > 0) {
//       tax = totalPrice * (taxPercent / 100);
//       totalPrice += tax;
//       if ((apiData as any).collage_tax_in === "no") prePayPrice += tax;
//     }

//     return {
//       total: totalPrice,
//       prePay: prePayPrice,
//       debt: totalPrice - prePayPrice,
//       tax,
//       rentDays,
//       dailyPrice,
//       extraItems,
//     };
//   }, [
//     apiData,
//     payableOptions,
//     selectedOptions,
//     insuranceComplete,
//     deliveryLocation,
//     returnLocation,
//     returnDifferent,
//     carDates,
//     dt,
//     rt,
//     currencyLabel,
//     t,
//   ]);

//   // ✅ قیمت و تخفیف واقعی از API
//   const pricing = useRentPricing(apiData, totals.rentDays);
//   const offPercent = pricing.offPercent;
//   const dailyBefore = pricing.dailyBefore;
//   const dailyAfter = pricing.dailyAfter;

//   const baseRentAfter = pricing.totalAfter;

//   // ✅ Meta (کاملاً i18n)
//   const dynamicTitle = useMemo(() => {
//     const b = branchName ? ` - ${branchName}` : "";
//     const d = rentDaysForTitle > 0 ? ` - ${t("common.days", { count: rentDaysForTitle })}` : "";
//     const car = (apiData as any)?.item?.title
//       ? ` - ${String((apiData as any).item.title).trim()}`
//       : "";
//     return t("meta.title", { branch: b, car, days: d });
//   }, [branchName, rentDaysForTitle, apiData, t]);

//   const dynamicDesc = useMemo(() => {
//     const branchPart = branchName ? t("meta.branchIn", { branch: branchName }) : "";
//     const daysPart = rentDaysForTitle > 0 ? t("meta.forDays", { days: rentDaysForTitle }) : "";
//     const carPart = (apiData as any)?.item?.title
//       ? t("meta.carInParens", { car: String((apiData as any).item.title).trim() })
//       : "";
//     return t("meta.desc", { branchPart, daysPart, carPart });
//   }, [branchName, rentDaysForTitle, apiData, t]);

//   const handleSubmit = async () => {
//     if (isSubmitting) return;

//     if (!userInfo.name || !userInfo.phone) {
//       toast.warning(t("toast.enterNamePhone"));
//       return;
//     }
//     if (!deliveryLocation?.location) {
//       toast.warning(t("toast.selectDeliveryPlace"));
//       return;
//     }
//     if (returnDifferent && !returnLocation?.location) {
//       toast.warning(t("toast.selectReturnPlace"));
//       return;
//     }

//     setIsSubmitting(true);

//     const normalizePhoneLocal = (p: any) => {
//       const s = String(p ?? "").replace(/[^\d+]/g, "").trim();
//       if (!s) return "";
//       if (s.startsWith("0098")) return "+98" + s.slice(4);
//       if (s.startsWith("098")) return "+98" + s.slice(3);
//       if (s.startsWith("98") && !s.startsWith("+98")) return "+98" + s.slice(2);
//       if (s.startsWith("0") && s.length === 11) return "+98" + s.slice(1);
//       return s;
//     };

//     const getSessionPhone = (sess: any) => {
//       const u = sess?.user ?? {};
//       return normalizePhoneLocal(u?.mobile ?? u?.username ?? u?.phone ?? "");
//     };

//     const wasLoggedIn = sessionStatus === "authenticated";
//     const sessionPhone = wasLoggedIn ? getSessionPhone(session) : "";
//     const formPhone = normalizePhoneLocal(userInfo.phone);

//     const shouldLogoutBeforeSubmit = Boolean(
//       wasLoggedIn && sessionPhone && formPhone && sessionPhone !== formPhone
//     );

//     if (shouldLogoutBeforeSubmit) {
//       try {
//         await signOut({ redirect: false });
//       } catch {
//         // ignore
//       }
//     }

//     try {
//       if (!carDates?.[0] || !carDates?.[1] || !branchIdFromUrl) {
//         toast.error(t("toast.invalidReservationInfo"));
//         return;
//       }
//       if (!selectedCarId) {
//         toast.error(t("toast.carNotSelected"));
//         return;
//       }

//       const places = Array.isArray(apiData?.places)
//         ? apiData!.places!.filter(Boolean)
//         : [];

//       const findPlace = (id: any) =>
//         places.find((p: any) => String(p?.id) === String(id));

//       const delObj = findPlace((deliveryLocation as any).location);
//       const delNeed = delObj?.need_address === "yes";

//       const retId = returnDifferent
//         ? (returnLocation as any).location || (deliveryLocation as any).location
//         : (deliveryLocation as any).location;

//       const retObj = findPlace(retId);
//       const retNeed = retObj?.need_address === "yes";

//       const lastNameForApi = "";

//       const payload = {
//         branch_id: branchIdFromUrl || 1,
//         from: carDates[0],
//         to: carDates[1],

//         dt: normalizeTime(dt),
//         rt: normalizeTime(rt),

//         place_delivery: (deliveryLocation as any).location,
//         address_delivery: delNeed ? (deliveryLocation as any).address || "" : "",

//         place_return: returnDifferent
//           ? (returnLocation as any).location ||
//             (deliveryLocation as any).location
//           : (deliveryLocation as any).location,

//         address_return: retNeed
//           ? returnDifferent
//             ? (returnLocation as any).address || ""
//             : (deliveryLocation as any).address || ""
//           : "",

//         place_r_custom: returnDifferent ? "yes" : "no",

//         first_name: userInfo.name,
//         last_name: lastNameForApi,
//         phone: userInfo.phone,
//         email: userInfo.email,
//         option_check: selectedOptions,
//         insurance_complete: insuranceComplete ? "yes" : "no",
//       };

//       const res: any = await api.post(
//         `/car/rent/${selectedCarId}/${locale}/registration`,
//         payload
//       );

//       const raw: any = res?.data ?? res;
//       const status = res?.status ?? raw?.status;

//       if (status && Number(status) !== 200) {
//         throw new Error(raw?.message || t("toast.reserveSubmitError"));
//       }

//       const payloadData: any = raw?.data ?? raw;

//       const rentCode =
//         payloadData?.item?.rent_code ??
//         payloadData?.rent_code ??
//         payloadData?.data?.item?.rent_code ??
//         payloadData?.data?.rent_code ??
//         null;

//       if (!rentCode) {
//         toast.warning(t("toast.reservedButNoRentCode"));
//         return;
//       }

//       const isNewUser =
//         payloadData?.is_new_user === true ||
//         payloadData?.data?.is_new_user === true;

//       const token =
//         payloadData?.access_token ?? payloadData?.data?.access_token ?? null;

//       const userId = payloadData?.user_id ?? payloadData?.data?.user_id ?? null;

//       const username =
//         payloadData?.username ??
//         payloadData?.data?.username ??
//         payloadData?.item?.phone ??
//         payloadData?.data?.item?.phone ??
//         "";

//       const nameFromApi =
//         payloadData?.item?.name ??
//         payloadData?.data?.item?.name ??
//         userInfo.name ??
//         "";

//       const phoneFromApi =
//         payloadData?.item?.phone ??
//         payloadData?.data?.item?.phone ??
//         userInfo.phone ??
//         "";

//       const emailFromApi =
//         payloadData?.item?.email ??
//         payloadData?.data?.item?.email ??
//         userInfo.email ??
//         "";

//       if (isNewUser && token) {
//         try {
//           await signIn("token", {
//             redirect: false,
//             accessToken: String(token),
//             user_id: userId != null ? String(userId) : "",
//             username: String(username),
//             phone: String(phoneFromApi),
//             name: String(nameFromApi),
//             email: emailFromApi ? String(emailFromApi) : "",
//           });
//         } catch {
//           // ignore
//         }
//       }

//       const paymentUrl =
//         payloadData?.payment_url || payloadData?.item?.payment_url;

//       const cb = encodeURIComponent(
//         `/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`
//       );

//       if (paymentUrl) {
//         const joiner = String(paymentUrl).includes("?") ? "&" : "?";
//         window.location.href = `${paymentUrl}${joiner}callback=${cb}`;
//         return;
//       }

//       toast.success(t("toast.reserveRequestDone"));

//       router.push(
//         `/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`
//       );
//     } catch (error: any) {
//       console.error("Booking Error:", error);
//       toast.error(error?.message || t("toast.reserveSubmitError"));
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSelectUser = (user: {
//     name?: string;
//     phone?: string;
//     email?: string;
//   }) => {
//     setUserInfo({
//       name: user.name || "",
//       phone: user.phone || "",
//       email: user.email || "",
//     });
//     setIsInfoListOpen(false);
//   };

//   // ✅ meta حتی زمان لود هم اعمال بشه
//   if (isLoading || !apiData) {
//     return (
//       <>
//         <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
//         <InformationStepSkeleton />
//       </>
//     );
//   }

//   // ✅ badges / banner فقط از API
//   const showNoDeposit =
//     String((apiData.item as any)?.deposit || "").toLowerCase() === "no";

//   const showUnlimitedKm =
//     String((apiData.item as any)?.km || "").toLowerCase() === "no";

//   const showFreeDelivery =
//     String((apiData.item as any)?.free_delivery || "").toLowerCase() === "yes";

//   const showFreeInsurance =
//     String((apiData.item as any)?.insurance || "").toLowerCase() === "yes";

//   const showDeposit =
//     String((apiData.item as any)?.deposit || "").toLowerCase() === "yes";
//   const depositPrice = safeNum((apiData.item as any)?.deposit_price, 0);

//   const photo0 = Array.isArray((apiData.item as any).photo)
//     ? (apiData.item as any).photo?.[0]
//     : typeof (apiData.item as any).photo === "string"
//       ? (apiData.item as any).photo
//       : "";

//   // ================== UI Blocks ==================
//   const SelectedCarCard = (
//     <Card className="border border-gray-200 rounded-none lg:rounded-xl shadow-sm p-0 bg-white dark:bg-gray-900 gap-0 overflow-hidden">
//       <div className="hidden md:block">
//         <CardHeader className="px-3 pt-4 pb-2 m-0">
//           <CardTitle className="text-sm text-gray-700 dark:text-gray-200">
//             {t("selectedCar.title")}
//           </CardTitle>
//         </CardHeader>
//         <Separator />
//       </div>

//       <CardContent className="p-2">
//         <div className="flex items-start gap-2">
//           <div className="relative w-26 h-18 rounded bg-gray-100 shrink-0 overflow-hidden">
//             <Image
//               src={`${STORAGE_URL}${photo0}` || "/images/placeholder.png"}
//               alt={(apiData.item as any).title}
//               fill
//               className="object-cover"
//             />
//           </div>

//           <div className="flex-1 min-w-0">
//             <div className="text-right font-bold text-gray-800 truncate leading-5">
//               {(apiData.item as any).title}
//             </div>

//             <SelectedCarMeta
//               fuel={(apiData.item as any).fuel}
//               gearbox={(apiData.item as any).gearbox}
//               baggage={(apiData.item as any).baggage}
//               passengers={(apiData.item as any).person}
//             />

//             <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600 ">
//               <div className="flex items-center gap-0.5 min-w-0">
//                 <span>{t("selectedCar.dailyPriceFor")}</span>
//                 <span className="text-gray-700">
//                   {t("common.days", { count: totals.rentDays })}
//                 </span>

//                 <PriceGroupsResponsive
//                   prices={(apiData as any)?.item?.prices}
//                   currencyLabel={currencyLabel}
//                   trigger={<Info className="size-4 text-gray-700" />}
//                 />

//                 <span>:</span>

//                 {offPercent > 0 ? (
//                   <span className="text-gray-400 line-through">
//                     {formatNum(dailyBefore)}
//                   </span>
//                 ) : null}

//                 <span className="text-gray-900 font-bold">
//                   {formatNum(dailyAfter)}
//                 </span>
//                 <span className="text-gray-500">{currencyLabel}</span>
//               </div>

//               {offPercent > 0 ? (
//                 <Badge className="rounded-full bg-amber-100 text-amber-900 dark:bg-amber-600 dark:text-amber-100 px-1 py-0.5 text-[12px]">
//                   {t("selectedCar.discountBadge", {
//                     percent: formatNum(offPercent),
//                   })}
//                 </Badge>
//               ) : null}
//             </div>
//           </div>
//         </div>

//         <Separator className="my-3" />

//         <div className="flex flex-wrap gap-2">
//           {showUnlimitedKm ? (
//             <Badge
//               variant="secondary"
//               className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
//             >
//               {t("badges.unlimitedKm")}
//             </Badge>
//           ) : null}

//           {showFreeDelivery ? (
//             <Badge
//               variant="secondary"
//               className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
//             >
//               {t("badges.freeDelivery")}
//             </Badge>
//           ) : null}

//           {showFreeInsurance ? (
//             <Badge
//               variant="secondary"
//               className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
//             >
//               {t("badges.freeInsurance")}
//             </Badge>
//           ) : null}

//           {showNoDeposit ? (
//             <Badge
//               variant="secondary"
//               className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 text-[11px]"
//             >
//               {t("badges.noDeposit")}
//             </Badge>
//           ) : null}
//         </div>

//         {showDeposit ? (
//           <>
//             <Separator className="my-4" />

//             <div className="text-right">
//               <div className="text-md font-bold text-gray-800">
//                 {t("deposit.title")}
//               </div>

//               <div className="mt-2 flex items-center justify-between">
//                 <div className="text-right flex items-center gap-2">
//                   <Coins size={16} className="text-gray-500" />
//                   <span className="text-sm font-semibold text-gray-500">
//                     {t("deposit.trafficDepositLabel")}
//                   </span>
//                 </div>

//                 <div className="text-left text-gray-700 whitespace-nowrap">
//                   {formatNum(depositPrice)} {currencyLabel}
//                 </div>
//               </div>

//               <div className="text-xs text-gray-500 mt-3 leading-5">
//                 {t("deposit.hint21Days")}
//               </div>
//             </div>
//           </>
//         ) : null}
//       </CardContent>
//     </Card>
//   );

//   const NoDepositBanner = (
//     <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950 bg-emerald-50 px-4 py-3 flex items-center gap-3">
//       <div className="mt-0.5 text-emerald-600">
//         <Coins size={22} />
//       </div>
//       <div className="flex-1">
//         <div className="font-bold text-emerald-800">
//           {t("noDepositBanner.title")}
//         </div>
//         <div className="text-sm text-emerald-700 mt-1">
//           {t("noDepositBanner.desc")}
//         </div>
//       </div>
//     </div>
//   );

//   const DeliveryCard = (
//     <Card className="border border-gray-200 rounded-xl shadow-sm py-3">
//       <CardHeader className="m-0 px-4">
//         <CardTitle className="text-base text-gray-900 flex items-center gap-2">
//           {t("deliveryCard.title")}
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="space-y-4 px-4">
//         <ResponsiveLocationPicker
//           title={t("deliveryCard.deliveryPickerTitle")}
//           currencyLabel={currencyLabel}
//           places={activePlaces as any}
//           value={deliveryLocation}
//           onChange={setDeliveryLocation}
//           placeholder={t("deliveryCard.deliveryPickerPlaceholder")}
//         />

//         <div className="flex items-center justify-between p-0 pb-4 m-0">
//           <Label className="flex items-center gap-3 cursor-pointer select-none">
//             <Switch
//               dir="ltr"
//               checked={returnDifferent}
//               onCheckedChange={(v) => {
//                 const next = Boolean(v);
//                 setReturnDifferent(next);
//                 if (!next) {
//                   setReturnLocation({
//                     isDesired: false,
//                     location: null,
//                     address: "",
//                   });
//                 }
//               }}
//             />
//             <span className="text-gray-800 font-semibold">
//               {t("deliveryCard.returnDifferentLabel")}
//             </span>
//           </Label>
//         </div>

//         {returnDifferent && (
//           <ResponsiveLocationPicker
//             title={t("deliveryCard.returnPickerTitle")}
//             currencyLabel={currencyLabel}
//             places={activePlaces as any}
//             value={returnLocation}
//             onChange={setReturnLocation}
//             placeholder={t("deliveryCard.returnPickerPlaceholder")}
//           />
//         )}
//       </CardContent>
//     </Card>
//   );

//   const ExtrasCard = !shouldShowExtrasSection ? null : (
//     <Card className="border border-gray-200 dark:border-gray-800 rounded-xl md:mb-4 shadow-sm p-0 m-0 gap-0 bg-white dark:bg-gray-900">
//       <CardHeader className="p-0 px-4 pt-2">
//         <CardTitle className="text-base text-gray-900 flex items-center">
//           {t("extras.title")}
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="p-0 m-0 pb-1">
//         <ExtrasList
//           options={payableOptions}
//           selected={selectedOptions}
//           setSelected={setSelectedOptions}
//           currencyLabel={currencyLabel}
//           insuranceComplete={insuranceComplete}
//           setInsuranceComplete={(v: boolean) => {
//             if (!canSelectInsuranceComplete) return;
//             triggerSummarySkeleton(-999);
//             setInsuranceComplete(Boolean(v));
//           }}
//           insuranceCompleteEnabled={canSelectInsuranceComplete}
//           insuranceCompleteDailyPrice={safeNum(
//             (apiData?.item as any)?.insurance_complete_price,
//             0
//           )}
//           onSelectionVisualChange={(changedOptionId: number) => {
//             triggerSummarySkeleton(Number(changedOptionId));
//           }}
//         />
//       </CardContent>
//     </Card>
//   );

//   const PersonalInfoCard = (
//     <Card className="border p-4 m-0 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
//       <CardHeader className="p-0 m-0">
//         <CardTitle className="text-base text-gray-900 flex justify-between items-center gap-2">
//           <p>{t("personalInfo.title")}</p>

//           <div className="flex items-center justify-between">
//             <Button
//               variant="link"
//               className="px-0 text-blue-600 font-semibold"
//               onClick={() => setIsInfoListOpen(true)}
//             >
//               <UserSearch size={16} className="ml-2" />
//               {t("personalInfo.alreadyRegistered")}
//             </Button>
//           </div>
//         </CardTitle>
//       </CardHeader>

//       <CardContent className="p-0 m-0">
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
//           <div className="md:col-span-5">
//             <Input
//               value={userInfo.name}
//               onChange={(e) =>
//                 setUserInfo((p) => ({ ...p, name: e.target.value }))
//               }
//               className="h-12 rounded-lg border-gray-300"
//               placeholder={t("personalInfo.placeholders.fullName")}
//             />
//           </div>

//           <div className="md:col-span-4 overflow-visible">
//             <div dir="ltr" className="w-full overflow-visible relative z-50">
//               <PhoneInput
//                 defaultCountry="ir"
//                 value={userInfo.phone}
//                 onChange={(phone: string) =>
//                   setUserInfo((p) => ({ ...p, phone }))
//                 }
//                 className="w-full"
//                 inputClassName="!h-12 !w-full !border-0 !bg-transparent !text-sm !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none !pl-3"
//                 countrySelectorStyleProps={{
//                   buttonClassName:
//                     "!h-12 !px-3 !border-0 !bg-transparent !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none",
//                 }}
//               />
//             </div>
//           </div>

//           <div className="md:col-span-3">
//             <Input
//               value={userInfo.email}
//               onChange={(e) =>
//                 setUserInfo((p) => ({ ...p, email: e.target.value }))
//               }
//               className="h-12 rounded-lg border-gray-300"
//               placeholder={t("personalInfo.placeholders.email")}
//               type="email"
//             />
//           </div>
//         </div>

//         <div className="text-xs text-gray-500 text-center mt-6">
//           {t("rules.rulesB")}{" "}
//           <Link className="text-blue-600 underline" href={"/rules"}>
//             {t("rules.rules2")}
//           </Link>{" "}
//           {t("rules.rulesA")}
//         </div>
//       </CardContent>
//     </Card>
//   );

//   const SummaryCard = (showButton: boolean) => (
//     <Card className="border border-gray-200 p-0 pt-2 pb-1 rounded-xl shadow-sm gap-0 overflow-hidden bg-white">
//       <CardHeader className="px-4">
//         <CardTitle className="text-md font-bold text-gray-700 p-0 m-0 text-right">
//           {t("summary.title")}
//         </CardTitle>
//       </CardHeader>

//       <Separator />

//       <CardContent className="pt-2 px-4">
//         <div>
//           <SummaryRow
//             label={t("summary.rentPriceLabel", { days: totals.rentDays })}
//             value={formatMoneyOrFree(baseRentAfter, currencyLabel)}
//             valueHint={
//               <button
//                 type="button"
//                 onClick={() => {
//                   setCouponState("idle");
//                   setCouponCode("");
//                   setCouponOpen(true);
//                 }}
//                 className="text-[10px] font-medium text-blue-600 mt-0.5"
//               >
//                 {t("summary.haveCoupon")}
//               </button>
//             }
//             subLabel={
//               offPercent > 0 ? (
//                 <span className="inline-flex items-center gap-1 flex-wrap justify-end">
//                   <span className="line-through text-gray-400">
//                     {formatNum(dailyBefore)}
//                   </span>
//                   <span>
//                     {formatNum(dailyAfter)} {currencyLabel}
//                   </span>
//                   <span className="text-gray-500">{t("common.daily")}</span>
//                   <span>(</span>
//                   <span>{t("summary.discountInline", { percent: offPercent })}</span>
//                   <span>)</span>
//                 </span>
//               ) : (
//                 <span className="inline-flex items-center gap-1 flex-wrap justify-end">
//                   <span>
//                     {formatNum(dailyAfter)} {currencyLabel}
//                   </span>
//                   <span className="text-gray-500">{t("common.daily")}</span>
//                 </span>
//               )
//             }
//           />

//           {totals.extraItems.slice(0, 12).map((x, i) => {
//             const optId = Number((x as any)?.optionId);
//             const shouldSkeleton =
//               Number.isFinite(optId) && Boolean(pendingSummaryIds[optId]);

//             return (
//               <SummaryRow
//                 key={i}
//                 label={x.title}
//                 value={formatMoneyOrFree(x.price, currencyLabel)}
//                 subLabel={(x as any).subLabel}
//                 loading={shouldSkeleton}
//               />
//             );
//           })}

//           {totals.tax > 0 && (
//             <SummaryRow
//               label={t("summary.tax")}
//               subLabel={t("summary.taxPercent", {
//                 percent: (apiData.item as any).tax_percent || "0",
//               })}
//               value={formatMoneyOrFree(totals.tax, currencyLabel)}
//             />
//           )}
//         </div>

//         <div className="mt-4 pt-4 border-gray-200">
//           <div className="flex items-end justify-between">
//             <div className="text-right">
//               <div className="text-lg text-gray-800">
//                 {t("summary.finalCostForDays", { days: totals.rentDays })}
//               </div>
//             </div>

//             <div className="text-lg text-blue-600 whitespace-nowrap">
//               {formatNum(totals.total)} {currencyLabel}
//             </div>
//           </div>
//         </div>

//         <div className="mt-4 py-4 pb-6 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-2">
//           <Info size={16} className="text-gray-400" />
//           <span>{t("summary.acceptRulesHint")}</span>
//         </div>

//         {showButton && (
//           <Button
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="w-full h-14 mb-4 rounded-xl text-base bg-blue-600 hover:bg-blue-700"
//           >
//             {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
//           </Button>
//         )}
//       </CardContent>
//     </Card>
//   );

//   return (
//     <>
//       <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />

//       <div className="relative">
//         {/* ===== Fake Coupon Dialog ===== */}
//         <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
//           <DialogContent className="max-w-md">
//             <DialogHeader>
//               <DialogTitle className="text-right">{t("coupon.title")}</DialogTitle>
//             </DialogHeader>

//             <div className="space-y-3">
//               <Label className="text-right text-sm text-gray-700">
//                 {t("coupon.enterLabel")}
//               </Label>

//               <Input
//                 value={couponCode}
//                 onChange={(e) => setCouponCode(e.target.value)}
//                 className="h-12 rounded-lg border-gray-300"
//                 placeholder={t("coupon.placeholder")}
//               />

//               {couponState === "invalid" ? (
//                 <div className="text-sm text-red-600 text-right">
//                   {t("coupon.invalidText")}
//                 </div>
//               ) : null}

//               <Button
//                 type="button"
//                 className="w-full h-12 rounded-xl font-extrabold"
//                 disabled={couponState === "checking" || couponCode.trim().length === 0}
//                 onClick={() => {
//                   if (couponTimerRef.current) clearTimeout(couponTimerRef.current);

//                   setCouponState("checking");
//                   couponTimerRef.current = setTimeout(() => {
//                     setCouponState("invalid");
//                     toast.error(t("coupon.invalidToast"));
//                   }, 2000);
//                 }}
//               >
//                 {couponState === "checking" ? t("coupon.checking") : t("coupon.apply")}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>

//         {/* ================= MOBILE LAYOUT ================= */}
//         <div className="lg:hidden pb-28">
//           {SelectedCarCard}

//           <div className="px-2">
//             {showNoDeposit ? <div className="mt-2">{NoDepositBanner}</div> : null}
//             <div className="mt-2">{DeliveryCard}</div>
//             <div className="mt-2">{ExtrasCard}</div>
//             <div className="mt-2">{SummaryCard(false)}</div>
//             <div className="mt-2">{PersonalInfoCard}</div>
//           </div>
//         </div>

//         {/* Sticky Bottom Bar (Mobile) */}
//         <div className="lg:hidden fixed bottom-0 left-0 right-0 z-60 bg-white border-t border-gray-200">
//           <div className="max-w-130 mx-auto px-4 py-3">
//             <div className="flex items-center justify-between mb-2">
//               <div className="text-xs text-gray-500">{t("mobileBar.payableAmount")}</div>
//               <div className="text-lg font-extrabold text-blue-600">
//                 {formatNum(totals.prePay)} {currencyLabel}
//               </div>
//             </div>

//             <Button
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="w-full h-12 rounded-xl text-base font-extrabold bg-blue-600 hover:bg-blue-700"
//             >
//               {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
//             </Button>
//           </div>
//         </div>

//         {/* ================= DESKTOP LAYOUT ================= */}
//         <div className="hidden lg:block">
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
//             <div className="lg:col-span-8 space-y-4">
//               {showNoDeposit ? NoDepositBanner : null}
//               {DeliveryCard}
//               {ExtrasCard}
//               {PersonalInfoCard}
//             </div>

//             <div className="lg:col-span-4 space-y-0">
//               {SelectedCarCard}
//               <div className="mt-4">{SummaryCard(true)}</div>
//             </div>
//           </div>
//         </div>

//         {/* ================= InfoList ================= */}
//         {isInfoListOpen && (
//           <InfoListDialog
//             open={isInfoListOpen}
//             onOpenChange={setIsInfoListOpen}
//             onSelect={handleSelectUser}
//           />
//         )}
//       </div>
//     </>
//   );
// }