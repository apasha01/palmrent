/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Info,
  ArrowRight,
  MapPin,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { LocationState } from "@/types/rent-information";

// ---------------- Types ----------------
type PlaceRow = {
  id: number | string;
  title: string;
  price_pay?: string | number;
  pre_price_pay?: string | number;
  need_address?: "yes" | "no";
  address_title?: string | null;
};

type Props = {
  // فقط برای Mobile Sheet (optional کنترل از بیرون)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  title: string;
  currencyLabel: string;

  places: PlaceRow[];

  value: LocationState;
  onChange: (next: LocationState) => void;

  placeholder?: string;
  triggerClassName?: string;
};

// ---------------- Helpers ----------------
function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

function toPriceNumber(x: any) {
  const n = typeof x === "number" ? x : parseFloat(String(x ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function oneLine(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

// ✅ کوتاه کردن آدرس برای نمایش داخل Trigger
function shortText(s: string, max = 44) {
  const x = oneLine(s);
  if (!x) return "";
  return x.length > max ? x.slice(0, max) + "…" : x;
}

export default function ResponsiveLocationPicker({
  open,
  onOpenChange,
  title,
  currencyLabel,
  places,
  value,
  onChange,
  placeholder = "انتخاب کنید",
  triggerClassName,
}: Props) {
  const isMobile = useIsMobile(1024);
  const placesSafe = React.useMemo(
    () => (Array.isArray(places) ? places : []),
    [places],
  );

  // ===== selected from value (only committed selection) =====
  const selectedKey = value?.location != null ? String(value.location) : "";
  const selectedPlace = React.useMemo(
    () => placesSafe.find((p) => String((p as any)?.id) === String(selectedKey)),
    [placesSafe, selectedKey],
  );

  const selectedNeedAddress =
    selectedPlace &&
    String((selectedPlace as any)?.need_address || "no") === "yes";

  const addressLabel = selectedPlace
    ? String((selectedPlace as any)?.address_title || "آدرس")
    : "آدرس";

  // ===== open states =====
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(Boolean(open));
  const [desktopOpen, setDesktopOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof open === "boolean") setMobileOpen(open);
  }, [open]);

  const emitOpenChange = React.useCallback(
    (v: boolean) => {
      setMobileOpen(v);
      onOpenChange?.(v);
    },
    [onOpenChange],
  );

  // ===== Pending selection for address-required flow (MOBILE ONLY) =====
  const [addressSheetOpen, setAddressSheetOpen] = React.useState(false);

  const [pendingKey, setPendingKey] = React.useState<string>("");
  const [pendingTitle, setPendingTitle] = React.useState<string>("");
  const [pendingAddressLabel, setPendingAddressLabel] =
    React.useState<string>("آدرس");
  const [pendingAddress, setPendingAddress] = React.useState<string>("");

  const resetPending = React.useCallback(() => {
    setPendingKey("");
    setPendingTitle("");
    setPendingAddressLabel("آدرس");
    setPendingAddress("");
  }, []);

  // ✅ Back inside address sheet: اگر آدرس ثبت نشده -> هیچ انتخابی ثبت نشده، برگرد به لیست
  const backFromAddress = React.useCallback(() => {
    setAddressSheetOpen(false);
    resetPending();
    emitOpenChange(true);
  }, [emitOpenChange, resetPending]);

  // ✅ Close address sheet completely (x / overlay): مثل back عمل کن
  const closeAddress = React.useCallback(() => {
    setAddressSheetOpen(false);
    resetPending();
    emitOpenChange(true);
  }, [emitOpenChange, resetPending]);

  // ===== Selection handler =====
  const selectPlace = React.useCallback(
    (key: string) => {
      const p = placesSafe.find((x) => String((x as any)?.id) === String(key));
      if (!p) return;

      const needAddress = String((p as any)?.need_address || "no") === "yes";

      // ✅ اگر آدرس نمی‌خواهد: همان لحظه commit
      if (!needAddress) {
        onChange({
          ...value,
          isDesired: false,
          location: String(key),
          address: "",
        });

        emitOpenChange(false);
        setDesktopOpen(false);
        return;
      }

      // ✅ اگر آدرس می‌خواهد:
      setPendingKey(String(key));
      setPendingTitle(String((p as any)?.title ?? ""));
      setPendingAddressLabel(String((p as any)?.address_title || "آدرس"));

      const isSameCommitted =
        value?.location != null && String(value.location) === String(key);

      setPendingAddress(isSameCommitted ? String(value.address || "") : "");

      emitOpenChange(false);
      setDesktopOpen(false);

      requestAnimationFrame(() => {
        setAddressSheetOpen(true);
      });
    },
    [emitOpenChange, onChange, placesSafe, value],
  );

  const confirmAddress = React.useCallback(() => {
    const addr = oneLine(pendingAddress);
    if (!addr) return;

    onChange({
      ...value,
      isDesired: true,
      location: String(pendingKey),
      address: addr,
    });

    setAddressSheetOpen(false);
    resetPending();
  }, [onChange, pendingAddress, pendingKey, resetPending, value]);

  // اگر گزینه committed تغییر کرد و نیاز به آدرس نداشت، آدرس رو پاک کن (safe)
  React.useEffect(() => {
    if (!selectedKey) return;
    if (
      !selectedNeedAddress &&
      oneLine(String((value as any)?.address || "")).length > 0
    ) {
      onChange({ ...value, isDesired: false, address: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeedAddress, selectedKey]);

  // ✅✅✅ فقط موبایل: اگر نیاز آدرس داشت، داخل همون Trigger آدرس/placeholder آدرس نمایش بده
  const mobileCommittedAddress = oneLine(String((value as any)?.address || ""));

  const buttonLabel = selectedPlace
    ? isMobile && selectedNeedAddress
      ? mobileCommittedAddress
        ? `${String((selectedPlace as any)?.title ?? "")} — ${shortText(mobileCommittedAddress)}`
        : `${String((selectedPlace as any)?.title ?? "")} — ${addressLabel} را وارد کنید`
      : String((selectedPlace as any)?.title ?? "")
    : placeholder;

  const TriggerButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full justify-between h-12 rounded-lg bg-transparent border-gray-300 text-gray-600",
        triggerClassName,
      )}
    >
      <span className={cn("truncate", selectedPlace ? "text-gray-800" : "text-gray-500")}>
        {buttonLabel}
      </span>
      <ChevronsUpDown size={18} className="text-gray-500" />
    </Button>
  );

  // ✅ Desktop inline address ONLY (همون کد خودت، دست نخورده)
  const DesktopAddressInline =
    !isMobile && selectedNeedAddress ? (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-600 text-right">{addressLabel}</Label>
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
            نیاز به آدرس
          </div>
        </div>

        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={String((value as any)?.address || "")}
            onChange={(e) => {
              const addr = oneLine(e.target.value);
              onChange({ ...value, isDesired: true, address: addr });
            }}
            placeholder={addressLabel}
            className="h-11 rounded-lg border-gray-300 pr-9"
          />
        </div>

        <div className="text-[11px] text-gray-500 text-right mt-2 flex items-start gap-2">
          <Info size={14} className="mt-0.5 text-gray-400" />
          <span>برای ثبت این گزینه، وارد کردن آدرس الزامی است.</span>
        </div>
      </div>
    ) : null;

  // ---------------- Mobile UI ----------------
  const MobileHeader = (
    <div className="shrink-0 border-b bg-white dark:bg-gray-800">
      <div className="px-4 py-2 flex items-center">
        <button
          type="button"
          onClick={() => emitOpenChange(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="بازگشت"
        >
          <ArrowRight size={20} className="text-gray-700" />
        </button>
        <div className="mr-2 font-bold text-gray-900 text-right">{title}</div>
      </div>
    </div>
  );

  const MobileList = (
    <div className="space-y-3 p-4 pb-28">
      {placesSafe.map((item, index) => {
        const id = String((item as any)?.id ?? index);
        const priceNum = toPriceNumber((item as any)?.price_pay);
        const isFree = priceNum <= 0;
        const needAddress = String((item as any)?.need_address || "no") === "yes";
        const checked = selectedKey === id;

        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => selectPlace(id)}
            className={cn(
              "rounded-2xl border bg-white transition-colors cursor-pointer select-none",
              checked ? "border-blue-200" : "border-gray-200",
              "hover:bg-gray-50",
            )}
          >
            <div className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {String((item as any)?.title ?? "")}
                </div>

                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>
                    هزینه: {isFree ? "رایگان" : `${priceNum.toLocaleString()} ${currencyLabel}`}
                  </span>

                  {needAddress ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      نیاز به آدرس
                    </span>
                  ) : null}
                </div>
              </div>

              <Badge variant="secondary" className="rounded-full whitespace-nowrap shrink-0">
                {isFree ? "رایگان" : `${priceNum.toLocaleString()}`}
              </Badge>
            </div>

            {checked && needAddress && oneLine(String((value as any)?.address || "")).length > 0 ? (
              <div className="px-3 pb-3">
                <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
                  <MapPin className="size-4 text-gray-400 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500">آدرس ثبت‌شده</div>
                    <div className="text-xs text-gray-800 truncate">
                      {oneLine(String((value as any)?.address || ""))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  const AddressMobileHeader = (
    <div className="shrink-0 border-b bg-white dark:bg-gray-800">
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={backFromAddress}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="بازگشت"
        >
          <ArrowRight size={20} className="text-gray-700" />
        </button>

        <div className="flex-1 mr-2">
          <div className="font-extrabold text-gray-900 text-right truncate">
            {pendingTitle || "آدرس"}
          </div>
          <div className="text-xs text-gray-500 text-right mt-0.5">
            {pendingAddressLabel}
          </div>
        </div>
      </div>
    </div>
  );

  const AddressMobileContent = (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-gray-600 text-right">{pendingAddressLabel}</Label>
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={pendingAddress}
            onChange={(e) => setPendingAddress(e.target.value)}
            placeholder={pendingAddressLabel}
            className="h-11 rounded-lg border-gray-300 pr-9"
          />
        </div>

        <div className="text-[11px] text-gray-500 text-right flex items-start gap-2">
          <Info size={14} className="mt-0.5 text-gray-400" />
          <span>برای ثبت انتخاب، وارد کردن آدرس الزامی است.</span>
        </div>
      </div>

      <Button
        type="button"
        className="w-full h-12 rounded-xl font-extrabold"
        disabled={oneLine(pendingAddress).length === 0}
        onClick={confirmAddress}
      >
        ثبت
      </Button>
    </div>
  );

  // ✅ RENDER
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between h-12 rounded-lg bg-transparent border-gray-300 text-gray-600",
            triggerClassName,
          )}
          onClick={() => emitOpenChange(true)}
        >
          <span
            className={cn(
              "truncate",
              selectedPlace
                ? selectedNeedAddress && oneLine(String((value as any)?.address || "")).length === 0
                  ? "text-gray-500"
                  : "text-gray-800"
                : "text-gray-500",
            )}
          >
            {buttonLabel}
          </span>
          <ChevronsUpDown size={18} className="text-gray-500" />
        </Button>

        {/* LIST SHEET */}
        <Sheet open={mobileOpen} onOpenChange={emitOpenChange}>
          <SheetContent
            showCloseButton={false}
            side="right"
            className={cn("p-0", "h-dvh w-screen max-w-none", "rounded-none border-0", "overflow-hidden")}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>

            <div className="h-dvh w-full flex flex-col overflow-hidden">
              {MobileHeader}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">{MobileList}</ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ADDRESS SHEET (OVER IT) */}
        <Sheet open={addressSheetOpen} onOpenChange={(v) => (v ? setAddressSheetOpen(true) : closeAddress())}>
          <SheetContent
            showCloseButton={false}
            side="right"
            className={cn("p-0", "h-dvh w-screen max-w-none", "rounded-none border-0", "overflow-hidden")}
          >
            <div className="h-dvh w-full flex flex-col overflow-hidden">
              {AddressMobileHeader}
              <div className="flex-1 overflow-auto">{AddressMobileContent}</div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // ✅ Desktop (دست نخورده)
  return (
    <>
      <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
        <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "p-0 overflow-hidden",
            "w-(--radix-popover-trigger-width)",
            "max-w-(--radix-popover-trigger-width)",
          )}
        >
          <div className="px-4 py-3">
            <div className="text-right font-extrabold text-gray-900">{title}</div>
          </div>

          <Command className="w-full">
            <CommandList className="w-full max-h-125 overflow-auto">
              <CommandEmpty>موردی پیدا نشد</CommandEmpty>

              <CommandGroup className="w-full">
                {placesSafe.map((item, idx) => {
                  const id = String((item as any)?.id ?? idx);
                  const priceNum = toPriceNumber((item as any)?.price_pay);
                  const isFree = priceNum <= 0;
                  const needAddress = String((item as any)?.need_address || "no") === "yes";
                  const active = selectedKey === id;

                  return (
                    <CommandItem
                      key={id}
                      value={String((item as any)?.title ?? "")}
                      onSelect={() => {
                        onChange({
                          ...value,
                          isDesired: needAddress ? true : false,
                          location: String(id),
                          address: needAddress ? String(value.address || "") : "",
                        });
                        setDesktopOpen(false);
                      }}
                      className="w-full flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {String((item as any)?.title ?? "")}
                          </span>

                          {needAddress ? (
                            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                              نیاز به آدرس
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          هزینه: {isFree ? "رایگان" : `${priceNum.toLocaleString()} ${currencyLabel}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="rounded-full whitespace-nowrap shrink-0">
                          {isFree ? "رایگان" : `${priceNum.toLocaleString()}`}
                        </Badge>
                        {active ? <Check className="h-4 w-4 text-blue-600 shrink-0" /> : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {DesktopAddressInline}
    </>
  );
}
