/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import jalaali from "jalaali-js"

import SearchMetaClient from "@/services/seo/SearchMetaClient"
import { getBranchNameById } from "@/helpers/BranchNameHelper"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days"
import { api } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserSearch } from "lucide-react"

import { InformationStepSkeleton } from "@/components/Loadings/InformationSetupSkeleton"
import ResponsiveLocationPicker from "@/components/search/extra/ResponsiveLocationPicker"
import { ExtrasList, formatNum } from "@/components/search/helpers/utils"
import { signIn, signOut, useSession } from "next-auth/react"
import CouponDialog from "@/components/reserve/CouponDialog"
import SelectedCarCard from "./SelectedCarCard"
import SummaryCard from "./SummaryCard"
import NoDepositBanner from "./NoDepositeBanner"
import { useRouter, useSearchParams } from "next/navigation"
import { Switch } from "../ui/switch"
import RulesSheet from "./RulesDrawer"
import PhoneInputCustom from "./PhoneInputCustom"
import { toast } from "react-toastify"
import ToastBanner from "../ui/toast"
import LoginDialog from "../auth/login-dialog"

/* ---------------- types ---------------- */
type ApiCalcResponse = any
type LocationState = { isDesired: boolean; location: any; address: string }
type Totals = {
  total: number
  prePay: number
  debt: number
  tax: number
  rentDays: number
  dailyPrice: number
  extraItems: { optionId?: number; title: string; price: number; subLabel?: React.ReactNode }[]
}
type UserInfo = { name: string; email: string; phone: string }

/* ---------------- cache ---------------- */
const calcCache = new Map<string, ApiCalcResponse>()
const calcInflight = new Map<string, Promise<ApiCalcResponse>>()

/* ---------------- statics ---------------- */
const EMPTY_LOCATION: LocationState = { isDesired: false, location: null, address: "" }

/* ---------------- utils ---------------- */
function oneLine(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}
function shortAddr(s: any, max = 50) {
  const x = oneLine(s)
  if (!x) return ""
  return x.length > max ? x.slice(0, max) + "…" : x
}
function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
  return Number.isFinite(n) ? n : fallback
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
function normalizePhone(p: any) {
  const s = String(p ?? "").replace(/[^\d+]/g, "").trim()
  if (!s) return ""
  if (s.startsWith("0098")) return "+98" + s.slice(4)
  if (s.startsWith("098")) return "+98" + s.slice(3)
  if (s.startsWith("98") && !s.startsWith("+98")) return "+98" + s.slice(2)
  if (s.startsWith("0") && s.length === 11) return "+98" + s.slice(1)
  return s
}
function pad2(n: number) {
  return String(n).padStart(2, "0")
}
function normalizeJalaliParam(input?: string | null) {
  if (!input) return null
  const clean = String(input).replace(/-/g, "/").trim()
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return `${y}/${pad2(m)}/${pad2(d)}`
}

function isElementActuallyVisible(el: HTMLElement) {
  const style = window.getComputedStyle(el)
  if (style.display === "none" || style.visibility === "hidden") return false
  if (el.getClientRects().length === 0) return false

  let current: HTMLElement | null = el
  while (current) {
    const cs = window.getComputedStyle(current)
    if (cs.display === "none" || cs.visibility === "hidden") return false
    current = current.parentElement
  }

  return true
}

function scrollToFirstErrorAnchor(anchorNames: string[], offset = 110) {
  const candidates: HTMLElement[] = []

  anchorNames.forEach((name) => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-error-anchor="${name}"]`),
    )

    nodes.forEach((node) => {
      if (isElementActuallyVisible(node)) {
        candidates.push(node)
      }
    })
  })

  if (!candidates.length) return

  const topmost = candidates
    .sort((a, b) => {
      const aTop = a.getBoundingClientRect().top + window.scrollY
      const bTop = b.getBoundingClientRect().top + window.scrollY
      return aTop - bTop
    })[0]

  const top = Math.max(topmost.getBoundingClientRect().top + window.scrollY - offset, 0)

  window.scrollTo({
    top,
    behavior: "smooth",
  })
}

/* ---------------- DeliveryCard types ---------------- */
type DeliveryCardProps = {
  activePlaces: any[]
  currencyLabel: string
  deliveryLocation: LocationState
  setDeliveryLocation: (v: LocationState) => void
  returnDifferent: boolean
  setReturnDifferent: (v: boolean) => void
  returnLocation: LocationState
  setReturnLocation: (v: LocationState) => void
  triggerSummarySkeleton: (id: number) => void
  t: any
  deliveryError: boolean
  returnError: boolean
  onDeliveryChange: (val: LocationState) => void
  onReturnChange: (val: LocationState) => void
}

/* ---------------- DeliveryCard ---------------- */
const DeliveryCard = React.memo(function DeliveryCard({
  activePlaces,
  currencyLabel,
  deliveryLocation,
  setDeliveryLocation,
  returnDifferent,
  setReturnDifferent,
  returnLocation,
  setReturnLocation,
  triggerSummarySkeleton,
  t,
  deliveryError,
  returnError,
  onDeliveryChange,
  onReturnChange,
}: DeliveryCardProps) {
  const handleDeliveryChange = useCallback((val: LocationState) => {
    triggerSummarySkeleton(0)
    setDeliveryLocation(val)
    onDeliveryChange(val)
  }, [triggerSummarySkeleton, setDeliveryLocation, onDeliveryChange])

  const handleReturnChange = useCallback((val: LocationState) => {
    triggerSummarySkeleton(0)
    setReturnLocation(val)
    onReturnChange(val)
  }, [triggerSummarySkeleton, setReturnLocation, onReturnChange])

  const handleSwitchChange = useCallback((v: boolean) => {
    const next = Boolean(v)
    triggerSummarySkeleton(0)
    setReturnDifferent(next)
    if (!next) setReturnLocation(EMPTY_LOCATION)
  }, [triggerSummarySkeleton, setReturnDifferent, setReturnLocation])

  return (
    <Card>
      <CardHeader className="m-0 px-4">
        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
          {t("deliveryCard.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 px-4">
        <div className="space-y-1">
          <ResponsiveLocationPicker
            title={t("deliveryCard.deliveryPickerTitle")}
            currencyLabel={currencyLabel}
            places={activePlaces}
            value={deliveryLocation}
            onChange={handleDeliveryChange}
            placeholder={
              deliveryError
                ? t("deliveryCard.deliveryRequiredPlaceholder") ?? "محل تحویل الزامی است"
                : t("deliveryCard.deliveryPickerPlaceholder")
            }
            placeholderClassName={deliveryError ? "text-red-500" : undefined}
            triggerClassName={deliveryError ? "border-red-500 ring-red-200 ring-1" : undefined}
          />

          {deliveryError && (
            <p className="text-xs px-1 text-red-500">
              {t("deliveryCard.deliveryRequiredPlaceholder") ?? "محل تحویل الزامی است"}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between p-0 py-2 m-0">
          <Label className="flex items-center gap-3 cursor-pointer select-none">
            <Switch
              dir="ltr"
              checked={returnDifferent}
              onCheckedChange={handleSwitchChange}
            />
            <span className="text-gray-800 font-semibold">
              {t("deliveryCard.returnDifferentLabel")}
            </span>
          </Label>
        </div>

        {returnDifferent && (
          <div className="space-y-1">
            <ResponsiveLocationPicker
              title={t("deliveryCard.returnPickerTitle")}
              currencyLabel={currencyLabel}
              places={activePlaces}
              value={returnLocation}
              onChange={handleReturnChange}
              placeholder={
                returnError
                  ? t("deliveryCard.returnRequiredPlaceholder") ?? "محل بازگشت الزامی است"
                  : t("deliveryCard.returnPickerPlaceholder")
              }
              placeholderClassName={returnError ? "text-red-500" : undefined}
              triggerClassName={returnError ? "border-red-500 ring-red-200 ring-1" : undefined}
            />

            {returnError && (
              <p className="text-xs px-1 text-red-500">
                {t("deliveryCard.returnRequiredPlaceholder") ?? "محل بازگشت الزامی است"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

/** pricing extractor */
function useRentPricing(apiData: ApiCalcResponse | null, rentDays: number) {
  return useMemo(() => {
    const item: any = apiData?.item || {}
    const offPercent = clamp(safeNum(item.off, 0), 0, 100)

    const dailyAfter =
      safeNum(item.rent_price_day_after_discount, 0) ||
      safeNum(item.rent_price_day, 0) ||
      safeNum(item.final_price, 0) ||
      0

    const dailyBefore =
      safeNum(item.rent_price_day_before_discount, 0) ||
      safeNum(item.rent_price, 0) ||
      (offPercent > 0 && dailyAfter > 0 ? dailyAfter / (1 - offPercent / 100) : dailyAfter)

    const totalAfter =
      safeNum(item.rent_total_after_discount, 0) ||
      safeNum(item.pay_price, 0) ||
      dailyAfter * (rentDays || 1)

    const totalBefore = safeNum(item.rent_total_before_discount, 0) || dailyBefore * (rentDays || 1)

    return { offPercent, dailyBefore, dailyAfter, totalBefore, totalAfter }
  }, [apiData, rentDays])
}

export default function ReserveInformation() {
  const t = useTranslations("InformationStep")
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()

  const storeCarDates = useSearchPageStore((s) => s.carDates)
  const storeDt = useSearchPageStore((s) => s.deliveryTime)
  const storeRt = useSearchPageStore((s) => s.returnTime)
  const storeSelectedCarId = useSearchPageStore((s) => s.selectedCarId)

  const urlFrom = normalizeJalaliParam(searchParams.get("from"))
  const urlTo = normalizeJalaliParam(searchParams.get("to"))
  const urlDt = normalizeTime(searchParams.get("dt") || "10:00")
  const urlRt = normalizeTime(searchParams.get("rt") || "10:00")

  const carDates = useMemo(() => {
    const s0 = normalizeJalaliParam(storeCarDates?.[0] ?? null)
    const s1 = normalizeJalaliParam(storeCarDates?.[1] ?? null)
    if (s0 && s1) return [s0, s1] as const
    if (urlFrom && urlTo) return [urlFrom, urlTo] as const
    return null
  }, [storeCarDates, urlFrom, urlTo])

  const dt = useMemo(() => normalizeTime(storeDt || urlDt || "10:00"), [storeDt, urlDt])
  const rt = useMemo(() => normalizeTime(storeRt || urlRt || "10:00"), [storeRt, urlRt])

  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id")
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }, [searchParams])

  const selectedCarId = useMemo(() => {
    const urlId = searchParams.get("car_id")
    if (urlId && urlId !== "null") return urlId
    if (storeSelectedCarId) return String(storeSelectedCarId)
    return null
  }, [searchParams, storeSelectedCarId])

  const tBranches = useTranslations("branchs")
  const branchName = useMemo(() => {
    const id = searchParams.get("branch_id")
    return getBranchNameById(tBranches, id, "")
  }, [searchParams, tBranches])

  const [deliveryLocation, setDeliveryLocation] = useState<LocationState>(EMPTY_LOCATION)
  const [returnLocation, setReturnLocation] = useState<LocationState>(EMPTY_LOCATION)
  const [returnDifferent, setReturnDifferent] = useState<boolean>(false)

  const [apiData, setApiData] = useState<ApiCalcResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [insuranceComplete, setInsuranceComplete] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", email: "", phone: "" })
const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [isSummaryPending, setIsSummaryPending] = useState(false)
  const summaryPendingTimerRef = useRef<any>(null)
  const [pendingSummaryIds, setPendingSummaryIds] = useState<Record<number, boolean>>({})
  const pendingTimersRef = useRef<Record<number, any>>({})

  /* ---- validation errors ---- */
  const [deliveryError, setDeliveryError] = useState(false)
  const [returnError, setReturnError] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)

  /* ---- banner ---- */
  const [bannerTriggerKey, setBannerTriggerKey] = useState(0)
  const [showBanner, setShowBanner] = useState(false)

  const triggerSummarySkeleton = useCallback((optionId: number, ms = 800) => {
    const id = Number(optionId)
    if (!Number.isFinite(id)) return

    setIsSummaryPending(true)

    if (summaryPendingTimerRef.current) clearTimeout(summaryPendingTimerRef.current)
    summaryPendingTimerRef.current = setTimeout(() => {
      setIsSummaryPending(false)
      summaryPendingTimerRef.current = null
    }, ms)

    if (pendingTimersRef.current[id]) clearTimeout(pendingTimersRef.current[id])

    setPendingSummaryIds((prev) => ({ ...prev, [id]: true }))
    pendingTimersRef.current[id] = setTimeout(() => {
      setPendingSummaryIds((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      delete pendingTimersRef.current[id]
    }, ms)
  }, [])

  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach((tt) => tt && clearTimeout(tt))
      pendingTimersRef.current = {}
      if (summaryPendingTimerRef.current) clearTimeout(summaryPendingTimerRef.current)
    }
  }, [])

  const { data: session, status: sessionStatus } = useSession()

  useEffect(() => {
    if (sessionStatus !== "authenticated") return

    const u: any = (session as any)?.user ?? {}
    const fullName =
      (u?.name && String(u.name).trim()) ||
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
      ""

    const phoneRaw = u?.phone ?? u?.username ?? u?.mobile ?? ""
    const phone = normalizePhone(phoneRaw)
    const email = (u?.email && String(u.email).trim()) || ""

    setUserInfo((prev) => ({
      name: prev.name?.trim() ? prev.name : fullName,
      phone: prev.phone?.trim() ? prev.phone : phone,
      email: prev.email?.trim() ? prev.email : email,
    }))
  }, [sessionStatus, session])

  const prevCarRef = useRef<string | null>(null)
  useEffect(() => {
    const cur = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null
    if (prevCarRef.current === null) {
      prevCarRef.current = cur
      return
    }
    if (prevCarRef.current !== cur) {
      prevCarRef.current = cur
      setSelectedOptions([])
      setInsuranceComplete(false)
      setDeliveryLocation(EMPTY_LOCATION)
      setReturnLocation(EMPTY_LOCATION)
      setReturnDifferent(false)
      setDeliveryError(false)
      setReturnError(false)
      setNameError(false)
      setPhoneError(false)
      setShowBanner(false)
    }
  }, [selectedCarId])

  const [couponOpen, setCouponOpen] = useState(false)

  const rentDaysForTitle = useMemo(() => {
    if (!carDates?.[0] || !carDates?.[1]) return 0
    try {
      return calcRentDaysWithGrace({
        fromDateJalali: carDates[0],
        toDateJalali: carDates[1],
        deliveryTime: dt,
        returnTime: rt,
        graceMinutes: 90,
        jalaliToDate: (jy, jm, jd) => {
          const g = jalaali.toGregorian(jy, jm + 1, jd)
          return new Date(g.gy, g.gm - 1, g.gd)
        },
      })
    } catch {
      return 0
    }
  }, [carDates, dt, rt])

  const fetchKey = useMemo(() => {
    const carId = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : ""
    const branchId = branchIdFromUrl ? String(branchIdFromUrl) : ""
    const from = carDates?.[0] || ""
    const to = carDates?.[1] || ""
    const loc = locale || ""
    return `${carId}|${branchId}|${from}|${to}|${loc}|${dt}|${rt}`
  }, [selectedCarId, branchIdFromUrl, carDates, locale, dt, rt])

  const lastFetchKeyRef = useRef<string>("")

  useEffect(() => {
    const carIdRaw = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null
    const branchIdRaw = branchIdFromUrl != null ? String(branchIdFromUrl) : null
    const from = carDates?.[0]
    const to = carDates?.[1]

    if (!carIdRaw || !branchIdRaw || !from || !to) {
      lastFetchKeyRef.current = ""
      setIsLoading(false)
      setApiData(null)
      return
    }

    if (lastFetchKeyRef.current === fetchKey && apiData !== null) {
      setIsLoading(false)
      return
    }

    lastFetchKeyRef.current = fetchKey
    setIsLoading(true)
    setApiData(null)

    let alive = true

    async function run() {
      try {
        const cached = calcCache.get(fetchKey)
        if (cached) {
          if (!alive) return
          setApiData(cached)
          setIsLoading(false)
          return
        }

        const inflight = calcInflight.get(fetchKey)
        if (inflight) {
          const data = await inflight
          if (!alive) return
          setApiData(data)
          setIsLoading(false)
          return
        }

        const params = new URLSearchParams()
        params.append("branch_id", String(branchIdRaw))
        params.append("from", String(from))
        params.append("to", String(to))
        params.append("dt", dt)
        params.append("rt", rt)

        const url = `/car/rent/${carIdRaw}/${locale}?${params.toString()}`

        const promise = (async () => {
          const res: any = await api.get(url)
          const payload = (res?.data ?? res) as ApiCalcResponse
          const status = res?.status ?? (payload as any)?.status
          if (status && Number(status) !== 200) throw new Error((payload as any)?.message || t("toast.fetchInfoError"))
          if (!payload?.item) throw new Error(t("toast.invalidServerResponse"))
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
        if (alive) toast.error(error?.message || t("toast.serverConnectionError"))
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    run()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, selectedCarId, branchIdFromUrl, carDates, locale, dt, rt, t])

  const activePlaces = useMemo(
    () => (Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : []),
    [apiData],
  )

  const currencyLabel = useMemo(() => {
    const cur = String((apiData as any)?.currency || "").trim().toUpperCase()
    if (!cur) return ""
    return (t as any).has?.(`currency.${cur}`) ? t(`currency.${cur}`) : cur
  }, [apiData, t])

  const payableOptions = useMemo(() => {
    const opts = Array.isArray((apiData as any)?.options) ? (apiData as any).options.filter(Boolean) : []
    return opts.filter((o: any) => safeNum(o?.price, 0) > 0 || safeNum(o?.price_pay, 0) > 0)
  }, [apiData])

  const canSelectInsuranceComplete = useMemo(
    () => String((apiData?.item as any)?.insurance_complete_status || "no").toLowerCase() === "yes",
    [apiData],
  )

  const shouldShowExtrasSection = useMemo(
    () => payableOptions.length > 0 || canSelectInsuranceComplete,
    [payableOptions, canSelectInsuranceComplete],
  )

  useEffect(() => {
    const allowed = new Set(payableOptions.map((o: any) => Number(o?.id)))
    setSelectedOptions((prev) => prev.filter((id) => allowed.has(Number(id))))
  }, [payableOptions])

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

    let totalPrice = safeNum((apiData.item as any).pay_price, 0)
    let prePayPrice = safeNum((apiData.item as any).pre_pay_price, 0)

    let rentDays = 1
    try {
      if (carDates?.length === 2) {
        rentDays = calcRentDaysWithGrace({
          fromDateJalali: carDates[0],
          toDateJalali: carDates[1],
          deliveryTime: dt,
          returnTime: rt,
          graceMinutes: 90,
          jalaliToDate: (jy, jm, jd) => {
            const g = jalaali.toGregorian(jy, jm + 1, jd)
            return new Date(g.gy, g.gm - 1, g.gd)
          },
        })
      }
    } catch {
      rentDays = safeNum((apiData.item as any).rent_days, 1)
    }

    rentDays = rentDays > 0 ? rentDays : 1

    const extraItems: Totals["extraItems"] = []
    const deliveryReturnItems: Totals["extraItems"] = []

    selectedOptions.forEach((optId) => {
      const opt = (payableOptions as any[]).find((o) => Number(o?.id) === Number(optId))
      if (!opt) return

      const optPrice = safeNum((opt as any).price_pay, 0)
      const preOpt = safeNum((opt as any).pre_price_pay, 0)
      totalPrice += optPrice
      prePayPrice += preOpt

      const perDay = rentDays > 0 ? Math.round(optPrice / rentDays) : optPrice

      extraItems.push({
        optionId: Number(optId),
        title: (opt as any).title,
        price: optPrice,
        subLabel: (
          <span className="inline-flex items-center gap-1">
            <span className="text-gray-500">{t("common.dailyPrice")}:</span>
            <span className="text-gray-500">{formatNum(perDay)} {currencyLabel}</span>
          </span>
        ),
      })
    })

    if (insuranceComplete) {
      const insPrice = safeNum((apiData.item as any).insurance_complete_price_pay, 0)
      const insPre = safeNum((apiData.item as any).pre_price_insurance_complete_price_pay, 0)
      totalPrice += insPrice
      prePayPrice += insPre

      const perDay =
        safeNum((apiData.item as any).insurance_complete_price, 0) ||
        (rentDays > 0 ? Math.round(insPrice / rentDays) : insPrice)

      extraItems.push({
        optionId: -999,
        title: t("extras.insuranceCompleteTitle"),
        price: insPrice,
        subLabel: (
          <span className="inline-flex items-center gap-1">
            <span className="text-gray-500">{formatNum(perDay)} {currencyLabel}</span>
            <span className="text-gray-500">{t("common.daily")}</span>
          </span>
        ),
      })
    }

    if (Array.isArray(apiData.places)) {
      const places = apiData.places.filter(Boolean)
      const getPlaceById = (id: any) => places.find((p) => p && String((p as any).id) === String(id))

      const isHotelField = (addressTitle: any) => {
        const s = String(addressTitle ?? "").toLowerCase()
        return s.includes("هتل") || s.includes("hotel")
      }

      const hotelSuffix = (placeObj: any, addr: any) => {
        const a = oneLine(addr)
        if (!a) return ""
        const title = (placeObj as any)?.address_title
        if (!isHotelField(title)) return ""
        return ` (${shortAddr(a, 35)})`
      }

      if (deliveryLocation?.location) {
        const del = getPlaceById((deliveryLocation as any).location)
        const delPrice = safeNum((del as any)?.price_pay, 0)
        const delPre = safeNum((del as any)?.pre_price_pay, 0)
        totalPrice += delPrice
        prePayPrice += delPre

        const delNeedAddr = String((del as any)?.need_address || "no") === "yes"
        const delHotel = delNeedAddr ? hotelSuffix(del, (deliveryLocation as any)?.address) : ""

        deliveryReturnItems.push({
          title: `${t("places.deliveryPrefix")}: ${(del as any)?.title || t("common.unknown")}${delHotel}`,
          price: delPrice,
        })
      }

      const effectiveReturn = returnDifferent ? returnLocation : deliveryLocation
      if ((effectiveReturn as any)?.location) {
        const ret = getPlaceById((effectiveReturn as any).location)
        const retPrice = safeNum((ret as any)?.price_pay, 0)
        const retPre = safeNum((ret as any)?.pre_price_pay, 0)

        if (returnDifferent) {
          totalPrice += retPrice
          prePayPrice += retPre
        }

        const retNeedAddr = String((ret as any)?.need_address || "no") === "yes"
        const retAddrValue = returnDifferent
          ? (returnLocation as any)?.address
          : (deliveryLocation as any)?.address
        const retHotel = retNeedAddr ? hotelSuffix(ret, retAddrValue) : ""

        deliveryReturnItems.push({
          title: `${t("places.returnPrefix")}: ${(ret as any)?.title || t("common.unknown")}${retHotel}`,
          price: retPrice,
        })
      }
    }

    let tax = 0
    const taxPercent = safeNum((apiData.item as any).tax_percent, 0)
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100)
      totalPrice += tax
      if ((apiData as any).collage_tax_in === "no") prePayPrice += tax
    }

    return {
      total: totalPrice,
      prePay: prePayPrice,
      debt: totalPrice - prePayPrice,
      tax,
      rentDays,
      dailyPrice: 0,
      extraItems: [...deliveryReturnItems, ...extraItems],
    }
  }, [apiData, payableOptions, selectedOptions, insuranceComplete, deliveryLocation, returnLocation, returnDifferent, carDates, dt, rt, currencyLabel, t])

  const pricing = useRentPricing(apiData, totals.rentDays)
  const offPercent = pricing.offPercent
  const dailyBefore = pricing.dailyBefore
  const dailyAfter = pricing.dailyAfter
  const baseRentAfter = pricing.totalAfter

  const totalBefore = useMemo(() => {
    if (offPercent <= 0 || pricing.totalBefore <= 0) return 0
    const rentDiff = pricing.totalBefore - pricing.totalAfter
    if (rentDiff <= 0) return 0
    return totals.total + rentDiff
  }, [offPercent, pricing.totalBefore, pricing.totalAfter, totals.total])

  const dynamicTitle = useMemo(() => {
    const b = branchName ? ` - ${branchName}` : ""
    const d = rentDaysForTitle > 0 ? ` - ${t("common.days", { count: rentDaysForTitle })}` : ""
    const car = (apiData as any)?.item?.title ? ` - ${String((apiData as any).item.title).trim()}` : ""
    return t("meta.title", { branch: b, car, days: d })
  }, [branchName, rentDaysForTitle, apiData, t])

  const dynamicDesc = useMemo(() => {
    const branchPart = branchName ? t("meta.branchIn", { branch: branchName }) : ""
    const daysPart = rentDaysForTitle > 0 ? t("meta.forDays", { days: rentDaysForTitle }) : ""
    const carPart = (apiData as any)?.item?.title
      ? t("meta.carInParens", { car: String((apiData as any).item.title).trim() })
      : ""
    return t("meta.desc", { branchPart, daysPart, carPart })
  }, [branchName, rentDaysForTitle, apiData, t])

  const handleDeliveryLocationChange = useCallback((val: LocationState) => {
    setDeliveryLocation(val)
  }, [])

  const handleReturnLocationChange = useCallback((val: LocationState) => {
    setReturnLocation(val)
  }, [])

  const handleDeliveryErrorClear = useCallback((val: LocationState) => {
    if (val?.location) setDeliveryError(false)
  }, [])

  const handleReturnErrorClear = useCallback((val: LocationState) => {
    if (val?.location) setReturnError(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    const nextDeliveryError = !deliveryLocation?.location
    const nextReturnError = Boolean(returnDifferent && !returnLocation?.location)
    const nextNameError = !userInfo.name?.trim()
    const nextPhoneError = !userInfo.phone?.trim()

    setDeliveryError(nextDeliveryError)
    setReturnError(nextReturnError)
    setNameError(nextNameError)
    setPhoneError(nextPhoneError)

    const hasError =
      nextDeliveryError || nextReturnError || nextNameError || nextPhoneError

    if (hasError) {
      setShowBanner(true)
      setBannerTriggerKey((k) => k + 1)

      const errorAnchors: string[] = []
      if (nextDeliveryError || nextReturnError) errorAnchors.push("delivery")
      if (nextNameError) errorAnchors.push("name")
      if (nextPhoneError) errorAnchors.push("phone")

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToFirstErrorAnchor(errorAnchors, 110)
        })
      })

      return
    }

    setIsSubmitting(true)

    const wasLoggedIn = sessionStatus === "authenticated"
    const sessionPhone = wasLoggedIn
      ? normalizePhone(
          (session as any)?.user?.mobile ??
          (session as any)?.user?.username ??
          (session as any)?.user?.phone ??
          "",
        )
      : ""

    const formPhone = normalizePhone(userInfo.phone)
    const shouldLogoutBeforeSubmit = Boolean(
      wasLoggedIn && sessionPhone && formPhone && sessionPhone !== formPhone,
    )

    if (shouldLogoutBeforeSubmit) {
      try {
        await signOut({ redirect: false })
      } catch {}
    }

    try {
      if (!carDates?.[0] || !carDates?.[1] || !branchIdFromUrl) {
        toast.error(t("toast.invalidReservationInfo"))
        return
      }

      if (!selectedCarId) {
        toast.error(t("toast.carNotSelected"))
        return
      }

      const places = Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : []
      const findPlace = (id: any) => places.find((p: any) => String(p?.id) === String(id))

      const delObj = findPlace((deliveryLocation as any).location)
      const delNeed = delObj?.need_address === "yes"

      const retId = returnDifferent
        ? (returnLocation as any).location || (deliveryLocation as any).location
        : (deliveryLocation as any).location

      const retObj = findPlace(retId)
      const retNeed = retObj?.need_address === "yes"

      const payload = {
        branch_id: branchIdFromUrl || 1,
        from: carDates[0],
        to: carDates[1],
        dt: normalizeTime(dt),
        rt: normalizeTime(rt),
        place_delivery: (deliveryLocation as any).location,
        address_delivery: delNeed ? (deliveryLocation as any).address || "" : "",
        place_return: returnDifferent
          ? (returnLocation as any).location || (deliveryLocation as any).location
          : (deliveryLocation as any).location,
        address_return: retNeed
          ? returnDifferent
            ? (returnLocation as any).address || ""
            : (deliveryLocation as any).address || ""
          : "",
        place_r_custom: returnDifferent ? "yes" : "no",
        first_name: userInfo.name,
        last_name: "",
        phone: userInfo.phone,
        email: userInfo.email,
        option_check: selectedOptions,
        insurance_complete: insuranceComplete ? "yes" : "no",
      }

      const res: any = await api.post(`/car/rent/${selectedCarId}/${locale}/registration`, payload)
      const raw: any = res?.data ?? res
      const status = res?.status ?? raw?.status
      if (status && Number(status) !== 200) {
        throw new Error(raw?.message || t("toast.reserveSubmitError"))
      }

      const payloadData: any = raw?.data ?? raw
      const rentCode =
        payloadData?.item?.rent_code ??
        payloadData?.rent_code ??
        payloadData?.data?.item?.rent_code ??
        payloadData?.data?.rent_code ??
        null

      if (!rentCode) {
        toast.warning(t("toast.reservedButNoRentCode"))
        return
      }

      const isNewUser = payloadData?.is_new_user === true || payloadData?.data?.is_new_user === true
      const token = payloadData?.access_token ?? payloadData?.data?.access_token ?? null
      const userId = payloadData?.user_id ?? payloadData?.data?.user_id ?? null
      const username =
        payloadData?.username ??
        payloadData?.data?.username ??
        payloadData?.item?.phone ??
        payloadData?.data?.item?.phone ??
        ""

      const nameFromApi =
        payloadData?.item?.name ??
        payloadData?.data?.item?.name ??
        userInfo.name ??
        ""

      const phoneFromApi =
        payloadData?.item?.phone ??
        payloadData?.data?.item?.phone ??
        userInfo.phone ??
        ""

      const emailFromApi =
        payloadData?.item?.email ??
        payloadData?.data?.item?.email ??
        userInfo.email ??
        ""

      if (isNewUser && token) {
        try {
          await signIn("token", {
            redirect: false,
            accessToken: String(token),
            user_id: userId != null ? String(userId) : "",
            username: String(username),
            phone: String(phoneFromApi),
            name: String(nameFromApi),
            email: emailFromApi ? String(emailFromApi) : "",
          })
        } catch {}
      }

      const paymentUrl = payloadData?.payment_url || payloadData?.item?.payment_url
      const cb = encodeURIComponent(
        `/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`,
      )

      if (paymentUrl) {
        const joiner = String(paymentUrl).includes("?") ? "&" : "?"
        window.location.href = `${paymentUrl}${joiner}callback=${cb}`
        return
      }

      toast.success(t("toast.reserveRequestDone"))
      router.push(`/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`)
    } catch (error: any) {
      toast.error(error?.message || t("toast.reserveSubmitError"))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    apiData,
    branchIdFromUrl,
    carDates,
    deliveryLocation,
    dt,
    insuranceComplete,
    isSubmitting,
    locale,
    returnDifferent,
    returnLocation,
    router,
    rt,
    selectedCarId,
    selectedOptions,
    session,
    sessionStatus,
    t,
    userInfo,
  ])



  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((p) => ({ ...p, name: e.target.value }))
    if (e.target.value.trim()) setNameError(false)
  }, [])

  const handlePhoneChange = useCallback((phone: string) => {
    setUserInfo((p) => ({ ...p, phone }))
    if (phone?.trim()) setPhoneError(false)
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo((p) => ({ ...p, email: e.target.value }))
  }, [])

  if (isLoading || !apiData) {
    return (
      <>
        <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
        <InformationStepSkeleton />
      </>
    )
  }

  const showNoDeposit = String((apiData.item as any)?.deposit || "").toLowerCase() === "no"
  const showUnlimitedKm = String((apiData.item as any)?.km || "").toLowerCase() === "no"
  const showFreeDelivery = String((apiData.item as any)?.free_delivery || "").toLowerCase() === "yes"
  const showFreeInsurance = String((apiData.item as any)?.insurance || "").toLowerCase() === "yes"
  const showDeposit = String((apiData.item as any)?.deposit || "").toLowerCase() === "yes"
  const depositPrice = safeNum((apiData.item as any)?.deposit_price, 0)

  const PersonalInfoCard = (
    <Card className="border px-2 py-4 m-0 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      <CardHeader className="p-0 m-0">
        <CardTitle className="text-sm text-gray-900 flex justify-between items-center">
          <p>{t("personalInfo.title")}</p>
          <div className="flex items-center justify-between">
<Button
  variant="link"
  className="px-0 text-blue-600 text-xs font-bold"
  onClick={() => setLoginDialogOpen(true)}
>
  <UserSearch size={14} />
  {t("personalInfo.alreadyRegistered")}
</Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-2 m-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* نام */}
          <div data-error-anchor="name" className="md:col-span-4 space-y-1">
            <Input
              value={userInfo.name}
              onChange={handleNameChange}
              className={`h-12 rounded-lg transition-colors ${
                nameError
                  ? "border-red-500 ring-1 ring-red-200 placeholder:text-red-400 focus-visible:ring-red-300"
                  : "border-gray-300"
              }`}
              placeholder={
                nameError
                  ? t("personalInfo.errors.nameRequired") ?? "نام الزامی است"
                  : t("personalInfo.placeholders.fullName")
              }
            />
            {nameError && (
              <p className="text-xs px-1 text-red-500">
                {t("personalInfo.errors.nameRequired") ?? "وارد کردن نام الزامی است"}
              </p>
            )}
          </div>

          {/* شماره */}
          <div data-error-anchor="phone" className="md:col-span-5 overflow-visible space-y-1">
            <div dir="ltr" className="w-full overflow-visible relative z-20">
              <PhoneInputCustom
                value={userInfo.phone}
                onChange={handlePhoneChange}
                error={phoneError}
                placeholder={
                  phoneError
                    ? t("personalInfo.errors.phoneRequired") ?? "وارد کردن شماره موبایل الزامی است"
                    : t("personalInfo.placeholders.phone") ?? "شماره وارد کنید (واتساپ)"
                }
              />
            </div>

            {phoneError && (
              <p className="text-xs px-1 text-red-500">
                {t("personalInfo.errors.phoneRequired") ?? "وارد کردن شماره موبایل الزامی است"}
              </p>
            )}
          </div>

          {/* ایمیل */}
          <div className="md:col-span-3">
            <Input
              value={userInfo.email}
              onChange={handleEmailChange}
              className="h-12 rounded-lg border-gray-300"
              placeholder={t("personalInfo.placeholders.email")}
              type="email"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mt-6 flex gap-1 justify-center">
          {t("rules.rulesB")}
          <RulesSheet />
          {t("rules.rulesA")}
        </div>
      </CardContent>
    </Card>
  )

  const ExtrasCard = !shouldShowExtrasSection ? null : (
    <Card className="border border-gray-200 dark:border-gray-800 rounded-xl md:mb-4 shadow-sm p-0 m-0 gap-0 bg-white dark:bg-gray-900">
      <CardHeader className="p-0 px-4 pt-2">
        <CardTitle className="text-base text-gray-900 flex items-center">
          {t("extras.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 m-0 pb-1">
        <ExtrasList
          options={payableOptions}
          selected={selectedOptions}
          setSelected={setSelectedOptions}
          currencyLabel={currencyLabel}
          insuranceComplete={insuranceComplete}
          setInsuranceComplete={(v: boolean) => {
            if (!canSelectInsuranceComplete) return
            triggerSummarySkeleton(-999)
            setInsuranceComplete(Boolean(v))
          }}
          insuranceCompleteEnabled={canSelectInsuranceComplete}
          insuranceCompleteDailyPrice={safeNum((apiData?.item as any)?.insurance_complete_price, 0)}
          onSelectionVisualChange={(changedOptionId: number) => triggerSummarySkeleton(Number(changedOptionId))}
        />
      </CardContent>
    </Card>
  )

  const sharedCarCardProps = {
    apiData,
    totals,
    currencyLabel,
    offPercent,
    dailyBefore,
    dailyAfter,
    showUnlimitedKm,
    showFreeDelivery,
    showFreeInsurance,
    showNoDeposit,
    showDeposit,
    depositPrice,
  }

  const sharedSummaryProps = {
    apiData,
    totals,
    currencyLabel,
    baseRentAfter,
    offPercent,
    dailyBefore,
    dailyAfter,
    totalBefore,
    pendingSummaryIds,
    isSummaryPending,
    onOpenCoupon: () => setCouponOpen(true),
    onSubmit: handleSubmit,
    isSubmitting,
  }

  const deliveryCardProps = {
    activePlaces,
    currencyLabel,
    deliveryLocation,
    setDeliveryLocation: handleDeliveryLocationChange,
    returnDifferent,
    setReturnDifferent,
    returnLocation,
    setReturnLocation: handleReturnLocationChange,
    triggerSummarySkeleton,
    t,
    deliveryError,
    returnError,
    onDeliveryChange: handleDeliveryErrorClear,
    onReturnChange: handleReturnErrorClear,
  }

  return (
    <>
      <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
      <CouponDialog open={couponOpen} onOpenChange={setCouponOpen} />

      {showBanner && (
        <ToastBanner
          text={"لطفاً اطلاعات الزامی را تکمیل کنید"}
          triggerKey={bannerTriggerKey}
          mobilePosition={{ side: "bottom", offset: 110 }}
          onClose={() => setShowBanner(false)}
        />
      )}

      <div className="relative">
        {/* MOBILE */}
        <div className="lg:hidden">
          <SelectedCarCard {...sharedCarCardProps} />
          <div className="px-2">
            {showNoDeposit ? <div className="mt-2"><NoDepositBanner /></div> : null}

            <div data-error-anchor="delivery">
              <DeliveryCard {...deliveryCardProps} />
            </div>

            <div className="mt-2">{ExtrasCard}</div>
            <div className="mt-2">
              <SummaryCard showButton={false} {...sharedSummaryProps} />
            </div>
            <div className="mt-2">{PersonalInfoCard}</div>
          </div>
        </div>

        {/* Sticky Bottom Bar - Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <div className="mx-auto px-4 py-3">
            <div className="flex items-center gap-20 justify-between mb-2">
              <div className="text-xs text-gray-500">{t("mobileBar.payableAmount")}</div>
              <div className="text-md flex items-center gap-2 font-extrabold text-blue-600">
                {isSummaryPending ? (
                  <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
                ) : (
                  <>
                    {offPercent > 0 && totalBefore > 0 && totalBefore > totals.total && (
                      <div className="text-xs text-gray-400 line-through inline-block mr-2">
                        {formatNum(totalBefore)}
                      </div>
                    )}
                    {formatNum(totals.total)} {currencyLabel}
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isSummaryPending}
              className="w-full h-11 rounded-lg text-base font-extrabold bg-blue-500 hover:bg-blue-700"
            >
              {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
            </Button>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {showNoDeposit ? <NoDepositBanner /> : null}

              <div data-error-anchor="delivery">
                <DeliveryCard {...deliveryCardProps} />
              </div>

              {ExtrasCard}
              {PersonalInfoCard}
            </div>

            <div className="lg:col-span-4 space-y-4">
              <SelectedCarCard {...sharedCarCardProps} />
              <SummaryCard showButton={true} {...sharedSummaryProps} />
            </div>
          </div>
        </div>
      </div>

<LoginDialog
  open={loginDialogOpen}
  onOpenChange={setLoginDialogOpen}
  hideTrigger
/>
    </>
  )
}