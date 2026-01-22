/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { JSX, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import PhoneInput from "react-phone-input-2"

import { ChevronDown, Info, UserSearch, ShieldCheck, Car, MapPin, Wallet } from "lucide-react"

import InfoListPopup from "./InfoListPopup"
import { SingleCarOptions } from "./card/CarsCard"

import { api } from "@/lib/apiClient"
import { dateDifference } from "@/lib/getDateDiffrence"
import { toast } from "react-toastify"
import { STORAGE_URL } from "../lib/apiClient"

// shadcn
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// ================== Types ==================

type LocalePlace = {
  id: number | string
  title: string
  price?: string
  price_pay?: string
  pre_price_pay?: string
}

type ApiOption = {
  id: number
  title: string
  description?: string
  price: string
  price_pay?: string
  pre_price_pay?: string
}

type ApiItem = {
  pay_price: string
  pre_pay_price: string
  rent_price_day: string
  rent_days: string
  insurance_complete_price_pay?: string
  pre_price_insurance_complete_price_pay?: string
  tax_percent?: string
  deposit_price: string
  price_2_toman: number
  title: string
  photo?: string[] | string

  gearbox?: string
  fuel?: string
  baggage?: any
  person?: any
}

type ApiCalcResponse = {
  item: ApiItem
  options?: ApiOption[]
  places?: LocalePlace[]
  currency: string
  collage_tax_in?: "yes" | "no"
}

type Totals = {
  total: number
  prePay: number
  debt: number
  tax: number
  rentDays: number
  dailyPrice: number
  extraItems: { title: string; price: number }[]
}

type UserInfo = {
  name: string
  email: string
  phone: string
}

type LocationState = {
  isDesired: boolean
  location: string | number | null
  address: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function formatNum(n: number) {
  try {
    return n.toLocaleString()
  } catch {
    return String(n)
  }
}

/**
 * ✅ IMPORTANT
 * برای جلوگیری از درخواست‌های پشت سر هم (خصوصاً در dev با StrictMode)
 * یک cache و inflight global داخل همین فایل می‌گذاریم.
 * به apiClient دست نمی‌زنیم.
 */
const calcCache = new Map<string, ApiCalcResponse>()
const calcInflight = new Map<string, Promise<ApiCalcResponse>>()

// ================== Main ==================

export default function InformationStep(): JSX.Element {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ===== URL Params =====
  const selectedCarId = searchParams.get("car_id")

  // ✅ IMPORTANT: from/to را جدا نگه دار تا آرایه جدید هر رندر ساخته نشود
  const urlFrom = searchParams.get("from")
  const urlTo = searchParams.get("to")

  // ✅ carDates فقط برای جاهای دیگر (مثل totals) به شکل memo شده
  const carDates = useMemo(() => {
    return urlFrom && urlTo ? ([urlFrom, urlTo] as const) : null
  }, [urlFrom, urlTo])

  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id")
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }, [searchParams])

  // ===== Local UI State =====
  const [deliveryLocation, setDeliveryLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  })
  const [returnLocation, setReturnLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  })

  // checkbox means "return in another place"
  const [returnDifferent, setReturnDifferent] = useState<boolean>(false)

  // Dialog state (choose place)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState<boolean>(false)
  const [isLocationReturn, setIsLocationReturn] = useState<boolean>(false)

  // InfoList popup
  const [isInfoListOpen, setIsInfoListOpen] = useState<boolean>(false)

  // Data
  const [apiData, setApiData] = useState<ApiCalcResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [insuranceComplete, setInsuranceComplete] = useState<boolean>(false)

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", email: "", phone: "" })

  // ================== Fetch (NO apiClient change / NO signal) ==================

  // ✅ کلید یکتا که فقط اگر واقعاً چیزی عوض شد دوباره fetch بزند
  const fetchKey = useMemo(() => {
    const carId = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : ""
    const branchId = branchIdFromUrl ? String(branchIdFromUrl) : ""
    const from = urlFrom || ""
    const to = urlTo || ""
    const loc = locale || ""
    return `${carId}|${branchId}|${from}|${to}|${loc}`
  }, [selectedCarId, branchIdFromUrl, urlFrom, urlTo, locale])

  const lastFetchKeyRef = useRef<string>("")

useEffect(() => {
  // ✅ اینجا raw ها ممکنه null باشند
  const carIdRaw = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null
  const branchIdRaw = branchIdFromUrl != null ? String(branchIdFromUrl) : null
  const fromRaw = urlFrom
  const toRaw = urlTo

  // ✅ Guard
  if (!carIdRaw) return
  if (!branchIdRaw) {
    toast.error("شعبه نامعتبر است")
    return
  }
  if (!fromRaw || !toRaw) {
    toast.error("تاریخ رزرو نامعتبر است")
    return
  }

  // ✅ از این به بعد TS می‌فهمه اینا string هستند
  const carId: string = carIdRaw
  const branchId: string = branchIdRaw
  const from: string = fromRaw
  const to: string = toRaw

  if (lastFetchKeyRef.current === fetchKey) return
  lastFetchKeyRef.current = fetchKey

  let alive = true

  async function run() {
    try {
      const cached = calcCache.get(fetchKey)
      if (cached) {
        setApiData(cached)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      const inflight = calcInflight.get(fetchKey)
      if (inflight) {
        const data = await inflight
        if (!alive) return
        setApiData(data)
        setIsLoading(false)
        return
      }

      const params = new URLSearchParams()
      params.append("branch_id", branchId)
      params.append("from", from)
      params.append("to", to)

      const url = `/car/rent/${carId}/${locale}?${params.toString()}`

      const promise = (async () => {
        const res: any = await api.get(url)
        const payload = (res?.data ?? res) as ApiCalcResponse

        const status = res?.status ?? (payload as any)?.status
        if (status && Number(status) !== 200) {
          throw new Error((payload as any)?.message || "خطا در دریافت اطلاعات.")
        }

        if (!payload?.item) throw new Error("پاسخ سرور نامعتبر است.")
        return payload
      })()

      calcInflight.set(fetchKey, promise)

      const data = await promise
      calcInflight.delete(fetchKey)
      calcCache.set(fetchKey, data)

      if (!alive) return
      setApiData(data)
    } catch (error: any) {
      calcInflight.delete(fetchKey)
      console.error("Calculation Error:", error)
      toast.error(error?.message || "خطا در ارتباط با سرور.")
    } finally {
      if (alive) setIsLoading(false)
    }
  }

  run()

  return () => {
    alive = false
  }
}, [fetchKey, selectedCarId, urlFrom, urlTo, branchIdFromUrl, locale])

  // ================== Places safe ==================
  const activePlaces = useMemo(() => {
    return Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : []
  }, [apiData?.places])

  const delPlace = activePlaces.find((p) => p && String(p.id) === String(deliveryLocation.location))
  const delTitle = delPlace ? delPlace.title : "محل تحویل خودرو را انتخاب کنید"

  const retPlace = activePlaces.find((p) => p && String(p.id) === String(returnLocation.location))
  const retTitle = retPlace ? retPlace.title : "محل عودت خودرو را انتخاب کنید"

  // ================== Totals ==================
  const totals: Totals = useMemo(() => {
    const safeTotals: Totals = {
      total: 0,
      prePay: 0,
      debt: 0,
      tax: 0,
      rentDays: 0,
      dailyPrice: 0,
      extraItems: [],
    }
    if (!apiData?.item) return safeTotals

    let totalPrice = parseFloat(apiData.item.pay_price) || 0
    let prePayPrice = parseFloat(apiData.item.pre_pay_price) || 0
    let dailyPrice = parseFloat(apiData.item.rent_price_day) || 0
    const extraItems: { title: string; price: number }[] = []

    let rentDays = parseInt(apiData.item.rent_days)
    if (!rentDays || isNaN(rentDays) || rentDays === 0) {
      try {
        if (carDates?.length === 2) {
          const diff = dateDifference(carDates[0], carDates[1])
          rentDays = diff.days || 1
        }
      } catch {
        rentDays = 1
      }
    }
    rentDays = rentDays > 0 ? rentDays : 1
    if (dailyPrice === 0 && totalPrice > 0) dailyPrice = totalPrice / rentDays

    // Options
    if (Array.isArray(apiData.options)) {
      selectedOptions.forEach((optId) => {
        const opt = apiData.options?.find((o) => o.id === optId)
        if (!opt) return
        const optPrice = parseFloat(opt.price_pay || "0")
        totalPrice += optPrice
        prePayPrice += parseFloat(opt.pre_price_pay || "0")
        if (optPrice > 0) extraItems.push({ title: opt.title, price: optPrice })
      })
    }

    // Insurance (complete)
    if (insuranceComplete) {
      const insPrice = parseFloat(apiData.item.insurance_complete_price_pay || "0")
      totalPrice += insPrice
      prePayPrice += parseFloat(apiData.item.pre_price_insurance_complete_price_pay || "0")
      if (insPrice > 0) extraItems.push({ title: "بسته جامع خسارت", price: insPrice })
    }

    // Locations
    if (Array.isArray(apiData.places)) {
      // Delivery
      if (deliveryLocation?.location && deliveryLocation.location !== "desired") {
        const del = apiData.places.find((p) => p && String(p.id) === String(deliveryLocation.location))
        if (del) {
          const delPrice = parseFloat(del.price_pay || "0")
          totalPrice += delPrice
          prePayPrice += parseFloat(del.pre_price_pay || "0")
          if (delPrice > 0) extraItems.push({ title: `هزینه تحویل: ${del.title}`, price: delPrice })
        }
      }

      // Return (only if returnDifferent)
      if (returnDifferent) {
        const target = returnLocation
        if (target?.location && target.location !== "desired") {
          const ret = apiData.places.find((p) => p && String(p.id) === String(target.location))
          if (ret) {
            const retPrice = parseFloat(ret.price_pay || "0")
            totalPrice += retPrice
            prePayPrice += parseFloat(ret.pre_price_pay || "0")
            if (retPrice > 0) extraItems.push({ title: `هزینه عودت: ${ret.title}`, price: retPrice })
          }
        }
      }
    }

    // Tax
    let tax = 0
    const taxPercent = parseFloat(apiData.item.tax_percent || "0")
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100)
      totalPrice += tax
      if (apiData.collage_tax_in === "no") prePayPrice += tax
    }

    return {
      total: totalPrice,
      prePay: prePayPrice,
      debt: totalPrice - prePayPrice,
      tax,
      rentDays,
      dailyPrice,
      extraItems,
    }
  }, [apiData, selectedOptions, insuranceComplete, deliveryLocation, returnLocation, returnDifferent, carDates])

  // ================== Dialog logic ==================
  const currentLocation = isLocationReturn ? returnLocation : deliveryLocation
  const [isDesiredChecked, setIsDesiredChecked] = useState(false)

  useEffect(() => {
    setIsDesiredChecked(Boolean(currentLocation?.isDesired))
  }, [isLocationReturn, currentLocation?.isDesired])

  function openLocationDialog(isReturn: boolean) {
    setIsLocationReturn(isReturn)
    setIsLocationDialogOpen(true)
  }

  function setCurrent(next: LocationState) {
    if (isLocationReturn) setReturnLocation(next)
    else setDeliveryLocation(next)
  }

  function inputChangeHandler(val: string) {
    if (val === "desired") {
      setIsDesiredChecked(true)
      setCurrent({ isDesired: true, location: "desired", address: "" })
    } else {
      setIsDesiredChecked(false)
      setCurrent({ isDesired: false, location: val, address: "" })
    }
  }

  function desiredInputChangeHandler(v: string) {
    setCurrent({ isDesired: true, location: "desired", address: v })
  }

  // ================== Submit (ROBUST with your apiClient) ==================
  const handleSubmit = async () => {
    if (isSubmitting) return

    if (!userInfo.name || !userInfo.phone) {
      toast.warning("لطفا نام و شماره تماس را وارد کنید")
      return
    }
    if (!deliveryLocation?.location) {
      toast.warning("لطفا محل تحویل را انتخاب کنید")
      return
    }
    if (returnDifferent && !returnLocation?.location) {
      toast.warning("لطفا محل عودت را انتخاب کنید")
      return
    }

    setIsSubmitting(true)
    try {
      if (!carDates?.[0] || !carDates?.[1] || !branchIdFromUrl) {
        toast.error("اطلاعات رزرو نامعتبر است")
        return
      }

      const payload = {
        branch_id: branchIdFromUrl || 1,
        from: carDates[0],
        to: carDates[1],

        place_delivery: deliveryLocation.location,
        address_delivery: deliveryLocation.isDesired ? deliveryLocation.address : "",

        place_return: returnDifferent ? returnLocation.location || deliveryLocation.location : deliveryLocation.location,
        address_return: returnDifferent
          ? returnLocation.isDesired
            ? returnLocation.address
            : ""
          : deliveryLocation.isDesired
          ? deliveryLocation.address
          : "",

        first_name: userInfo.name,
        last_name: ".",
        phone: userInfo.phone,
        email: userInfo.email,
        option_check: selectedOptions,
        insurance_complete: insuranceComplete ? "yes" : "no",
      }

      const res: any = await api.post(`/car/rent/${selectedCarId}/${locale}/registration`, payload)
      const data: any = res?.data ?? res

      // اگر بک‌اند status داخل json می‌دهد:
      const status = res?.status ?? data?.status
      if (status && Number(status) !== 200) {
        throw new Error(data?.message || "خطا در ثبت رزرو")
      }

      const rentId = data?.item?.rent_id ?? data?.rent_id
      if (!rentId) {
        toast.warning("رزرو ثبت شد ولی rent_id دریافت نشد")
        return
      }

      const paymentUrl = data?.payment_url || data?.item?.payment_url
      if (paymentUrl) {
        const cb = encodeURIComponent(`/rent/${rentId}`)
        const joiner = paymentUrl.includes("?") ? "&" : "?"
        window.location.href = `${paymentUrl}${joiner}callback=${cb}`
        return
      }

      toast.success("درخواست رزرو انجام شد")
      router.push(`/rent/reservation?status=initialize&rentid=${rentId}`)
    } catch (error: any) {
      console.error("Booking Error:", error)
      toast.error(error?.message || "خطا در ثبت رزرو")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectUser = (user: { name?: string; phone?: string; email?: string }) => {
    setUserInfo({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
    })
    setIsInfoListOpen(false)
  }

  // ================== SKELETON LOADING ==================
  if (isLoading || !apiData) {
    return <InformationStepSkeleton />
  }

  // ===== left sidebar =====
  const photo0 =
    Array.isArray(apiData.item.photo)
      ? apiData.item.photo?.[0]
      : typeof apiData.item.photo === "string"
      ? apiData.item.photo
      : ""

  const baseRent = totals.dailyPrice * totals.rentDays || 0
  const insuranceLine = insuranceComplete ? parseFloat(apiData.item.insurance_complete_price_pay || "0") : 0

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          {/* Green banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5 text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-emerald-800">بدون ودیعه (دیپوزیت)</div>
              <div className="text-sm text-emerald-700 mt-1">
                برای رزرو این خودرو نیازی به پرداخت ودیعه (دیپوزیت) نیست؛ فقط هزینه اجاره را پرداخت می‌کنید.
              </div>
            </div>
          </div>

          {/* Delivery */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-gray-500" />
                دوست دارید خودرو را کجا تحویل بگیرید؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-12 rounded-lg border-gray-300 text-gray-600"
                onClick={() => openLocationDialog(false)}
              >
                <span className={cn("truncate", deliveryLocation.location ? "text-gray-800" : "text-gray-500")}>
                  {deliveryLocation.location ? delTitle : "محل تحویل خودرو را انتخاب کنید"}
                </span>
                <ChevronDown size={18} className="text-gray-500" />
              </Button>

              {deliveryLocation.isDesired && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">آدرس دقیق (اختیاری)</Label>
                  <Input
                    value={deliveryLocation.address}
                    onChange={(e) => setDeliveryLocation((p) => ({ ...p, address: e.target.value }))}
                    className="h-11 rounded-lg border-gray-300"
                    placeholder="آدرس را وارد کنید"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-3 cursor-pointer select-none">
                  <Checkbox
                    checked={returnDifferent}
                    onCheckedChange={(v) => {
                      const next = Boolean(v)
                      setReturnDifferent(next)
                      if (!next) setReturnLocation({ isDesired: false, location: null, address: "" })
                    }}
                  />
                  <span className="text-gray-800 font-semibold">خودرو را در محل دیگری عودت می‌دهم</span>
                </Label>
              </div>

              {returnDifferent && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-12 rounded-lg border-gray-300 text-gray-600"
                    onClick={() => openLocationDialog(true)}
                  >
                    <span className={cn("truncate", returnLocation.location ? "text-gray-800" : "text-gray-500")}>
                      {returnLocation.location ? retTitle : "محل عودت خودرو را انتخاب کنید"}
                    </span>
                    <ChevronDown size={18} className="text-gray-500" />
                  </Button>

                  {returnLocation.isDesired && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">آدرس دقیق (اختیاری)</Label>
                      <Input
                        value={returnLocation.address}
                        onChange={(e) => setReturnLocation((p) => ({ ...p, address: e.target.value }))}
                        className="h-11 rounded-lg border-gray-300"
                        placeholder="آدرس را وارد کنید"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extras */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Wallet size={18} className="text-gray-500" />
                آپشن‌های اضافی را انتخاب کنید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ExtrasList
                options={apiData.options || []}
                selected={selectedOptions}
                setSelected={setSelectedOptions}
                insuranceComplete={insuranceComplete}
                setInsuranceComplete={setInsuranceComplete}
              />
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Car size={18} className="text-gray-500" />
                مشخصات خود را وارد کنید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="link" className="px-0 text-blue-600 font-semibold" onClick={() => setIsInfoListOpen(true)}>
                  <UserSearch size={16} className="ml-2" />
                  قبلاً ثبت نام کردم
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <Input
                    value={userInfo.name}
                    onChange={(e) => setUserInfo((p) => ({ ...p, name: e.target.value }))}
                    className="h-12 rounded-lg border-gray-300"
                    placeholder="نام و نام خانوادگی"
                  />
                </div>

                <div className="md:col-span-4">
                  <div dir="ltr">
                    <PhoneInput
                      country={"ae"}
                      value={userInfo.phone}
                      onChange={(phone: string) => setUserInfo((p) => ({ ...p, phone }))}
                      containerStyle={{ width: "100%" }}
                      inputStyle={{
                        width: "100%",
                        height: "48px",
                        borderRadius: "8px",
                        borderColor: "#D1D5DB",
                        fontSize: "14px",
                        paddingLeft: "48px",
                      }}
                      buttonStyle={{
                        borderRadius: "8px 0 0 8px",
                        borderColor: "#D1D5DB",
                        borderRight: "none",
                        backgroundColor: "#F9FAFB",
                      }}
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <Input
                    value={userInfo.email}
                    onChange={(e) => setUserInfo((p) => ({ ...p, email: e.target.value }))}
                    className="h-12 rounded-lg border-gray-300"
                    placeholder="ایمیل"
                    type="email"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                {t("rulesB")}{" "}
                <Link className="text-blue-600 underline" href={"/rules"}>
                  {t("rules2")}
                </Link>{" "}
                {t("rulesA")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ RIGHT SIDEBAR */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-gray-700">خودرو انتخابی شما</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex gap-3 items-start">
                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={`${STORAGE_URL}${photo0}` || "/images/placeholder.png"}
                    alt={apiData.item.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="font-bold text-gray-800">{apiData.item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    قیمت روزانه: <span className="font-semibold text-gray-700">{formatNum(totals.dailyPrice)}</span>{" "}
                    {t(apiData.currency)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    مدت رزرو: <span className="font-semibold text-gray-700">{totals.rentDays}</span> روز
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  بدون ودیعه
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  تحویل رایگان
                </Badge>
                <Badge variant="secondary" className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  کیلومتر نامحدود
                </Badge>
              </div>

              <Separator />

              <div className="text-xs text-gray-600">
                <SingleCarOptions
                  car={{
                    gearbox: apiData.item.gearbox === "اتوماتیک" ? "automatic" : "geared",
                    fuel: apiData.item.fuel,
                    baggage: apiData.item.baggage,
                    passengers: apiData.item.person,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-gray-700">جزئیات حساب</CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <SummaryRow label={`قیمت اجاره ${totals.rentDays} روز`} value={`${formatNum(baseRent)} ${t(apiData.currency)}`} />
              {insuranceLine > 0 && <SummaryRow label="آپشن بدون دیپوزیت" value={`${formatNum(insuranceLine)} ${t(apiData.currency)}`} />}

              {totals.extraItems
                .filter((x) => x.price > 0)
                .slice(0, 6)
                .map((x, i) => <SummaryRow key={i} label={x.title} value={`${formatNum(x.price)} ${t(apiData.currency)}`} />)}

              {totals.tax > 0 && (
                <SummaryRow label={`مالیات (${apiData.item.tax_percent || "0"}٪)`} value={`${formatNum(totals.tax)} ${t(apiData.currency)}`} />
              )}

              <Separator />

              <div className="flex items-end justify-between">
                <div className="text-sm font-bold text-gray-800">هزینه نهایی برای {totals.rentDays} روز</div>
                <div className="text-lg font-extrabold text-blue-600">
                  {formatNum(totals.total)} {t(apiData.currency)}
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex items-start gap-2">
                <Info size={14} className="mt-0.5 text-gray-400" />
                <span>با ثبت رزرو قوانین پالم رنت را می‌پذیرید</span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "در حال ثبت..." : "ثبت رزرو نهایی"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= Location Dialog ================= */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-[520px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-gray-50">
            <DialogTitle className="text-base font-bold text-gray-900">
              {isLocationReturn ? "محل عودت را انتخاب کنید" : "محل تحویل را انتخاب کنید"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-4 space-y-3">
              <RadioGroup
                value={currentLocation?.isDesired ? "desired" : currentLocation?.location ? String(currentLocation.location) : ""}
                onValueChange={(v) => inputChangeHandler(v)}
              >
                {activePlaces.map((item, index) => (
                  <Label
                    key={item?.id ?? index}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <RadioGroupItem value={String(item?.id)} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800">{item?.title}</div>
                      {parseInt(item?.price_pay || "0") > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          هزینه: {item?.price_pay} {t(apiData.currency)}
                        </div>
                      )}
                    </div>

                    {parseInt(item?.price_pay || "0") > 0 && (
                      <Badge variant="secondary" className="rounded-full">
                        {item?.price_pay}
                      </Badge>
                    )}
                  </Label>
                ))}

                <Separator className="my-2" />

                <Label className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="desired" />
                  <div className="flex-1 text-sm font-semibold text-gray-800">سایر (آدرس دلخواه)</div>
                </Label>
              </RadioGroup>

              {isDesiredChecked && (
                <div className="pt-2 space-y-1">
                  <Label className="text-xs text-gray-500">آدرس دلخواه</Label>
                  <Input
                    value={(isLocationReturn ? returnLocation.address : deliveryLocation.address) || ""}
                    onChange={(e) => desiredInputChangeHandler(e.target.value)}
                    placeholder="آدرس را وارد کنید"
                    className="h-11 rounded-lg border-gray-300"
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-white">
            <Button
              className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold"
              onClick={() => setIsLocationDialogOpen(false)}
            >
              انجام شد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= InfoList ================= */}
      {isInfoListOpen && <InfoListPopup onSelect={handleSelectUser} />}
    </div>
  )
}

// ================== Skeleton component (first load) ==================

function InformationStepSkeleton() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          {/* green banner skeleton */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-start gap-3">
            <Skeleton className="h-6 w-6 rounded-md bg-emerald-200/60" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-emerald-200/60" />
              <Skeleton className="h-3 w-5/6 bg-emerald-200/50" />
            </div>
          </div>

          {/* card 1 */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* card 2 */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* card 3 */}
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-4">
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <Skeleton className="h-12 w-full rounded-lg md:col-span-5" />
                <Skeleton className="h-12 w-full rounded-lg md:col-span-4" />
                <Skeleton className="h-12 w-full rounded-lg md:col-span-3" />
              </div>
              <Skeleton className="h-4 w-72 mx-auto" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex gap-3 items-start">
                <Skeleton className="w-28 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="py-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <Separator />

              <div className="flex items-end justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-6 w-24" />
              </div>

              <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-52" />
              </div>

              <Skeleton className="h-12 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ================== Small UI helpers ==================

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-gray-700 font-medium">{label}</div>
      <div className="text-gray-700">{value}</div>
    </div>
  )
}

function ExtrasList({
  options,
  selected,
  setSelected,
  insuranceComplete,
  setInsuranceComplete,
}: {
  options: ApiOption[]
  selected: number[]
  setSelected: (v: number[]) => void
  insuranceComplete: boolean
  setInsuranceComplete: (v: boolean) => void
}) {
  function toggleOption(id: number) {
    if (selected.includes(id)) setSelected(selected.filter((i) => i !== id))
    else setSelected([...selected, id])
  }

  return (
    <div className="space-y-2">
      {options.map((item) => {
        const checked = selected.includes(item.id)
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleOption(item.id)}
          >
            <div className="flex items-center gap-3">
              <Checkbox checked={checked} onCheckedChange={() => toggleOption(item.id)} />
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                {item.description ? <div className="text-xs text-gray-500 line-clamp-1">{item.description}</div> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Info size={18} className="text-gray-400" />
              <div className="text-sm font-bold text-gray-800">
                {parseInt(item.price) === 0 ? "رایگان" : `${item.price} `}
                <span className="text-xs font-medium text-gray-500">درهم روزانه</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Insurance row */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={insuranceComplete} onCheckedChange={(v) => setInsuranceComplete(Boolean(v))} />
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-gray-800">بسته جامع خسارت</div>
            <div className="text-xs text-gray-500">پوشش کامل‌تر برای آرامش خیال</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Info size={18} className="text-gray-400" />
          <div className="text-sm font-bold text-gray-800">
            <span className="text-xs font-medium text-gray-500">انتخاب</span>
          </div>
        </div>
      </div>
    </div>
  )
}
