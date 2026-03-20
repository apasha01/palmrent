/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Info,
  ArrowRight,
  MapPin,
  ChevronsUpDown,
  Check,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  currencyLabel: string;
  places: PlaceRow[];
  value: LocationState;
  onChange: (next: LocationState) => void;
  placeholder?: string;
  triggerClassName?: string;
  placeholderClassName?: string;
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

function shortText(s: string, max = 44) {
  const x = oneLine(s);
  if (!x) return "";
  return x.length > max ? x.slice(0, max) + "…" : x;
}

const SHEET_STYLE: React.CSSProperties = {
  width: "100vw",
  maxWidth: "100vw",
  height: "100dvh",
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  margin: 0,
  padding: 0,
  borderRadius: 0,
  border: "none",
};

export default function ResponsiveLocationPicker({
  open,
  onOpenChange,
  title,
  currencyLabel,
  places,
  value,
  onChange,
  placeholder,
  triggerClassName,
  placeholderClassName,
}: Props) {
  const t = useTranslations("ResponsiveLocationPicker");

  const isMobile = useIsMobile(1024);
  const placesSafe = React.useMemo(
    () => (Array.isArray(places) ? places : []),
    [places],
  );

  const fallbackPlaceholder = placeholder ?? t("trigger.placeholder");

  const selectedKey = value?.location != null ? String(value.location) : "";
  const selectedPlace = React.useMemo(
    () => placesSafe.find((p) => String((p as any)?.id) === String(selectedKey)),
    [placesSafe, selectedKey],
  );

  const selectedNeedAddress =
    selectedPlace &&
    String((selectedPlace as any)?.need_address || "no") === "yes";

  const addressLabel = selectedPlace
    ? String((selectedPlace as any)?.address_title || t("address.defaultLabel"))
    : t("address.defaultLabel");

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

  const [addressSheetOpen, setAddressSheetOpen] = React.useState(false);
  const [pendingKey, setPendingKey] = React.useState<string>("");
  const [pendingTitle, setPendingTitle] = React.useState<string>("");
  const [pendingAddressLabel, setPendingAddressLabel] =
    React.useState<string>(t("address.defaultLabel"));
  const [pendingAddress, setPendingAddress] = React.useState<string>("");

  const resetPending = React.useCallback(() => {
    setPendingKey("");
    setPendingTitle("");
    setPendingAddressLabel(t("address.defaultLabel"));
    setPendingAddress("");
  }, [t]);

  const backFromAddress = React.useCallback(() => {
    setAddressSheetOpen(false);
    resetPending();
    emitOpenChange(true);
  }, [emitOpenChange, resetPending]);

  const closeAddress = React.useCallback(() => {
    setAddressSheetOpen(false);
    resetPending();
    emitOpenChange(true);
  }, [emitOpenChange, resetPending]);

  const selectPlace = React.useCallback(
    (key: string) => {
      const p = placesSafe.find((x) => String((x as any)?.id) === String(key));
      if (!p) return;

      const needAddress = String((p as any)?.need_address || "no") === "yes";

      if (!needAddress) {
        onChange({ ...value, isDesired: false, location: String(key), address: "" });
        emitOpenChange(false);
        setDesktopOpen(false);
        return;
      }

      setPendingKey(String(key));
      setPendingTitle(String((p as any)?.title ?? ""));
      setPendingAddressLabel(
        String((p as any)?.address_title || t("address.defaultLabel")),
      );

      const isSameCommitted =
        value?.location != null && String(value.location) === String(key);
      setPendingAddress(isSameCommitted ? String(value.address || "") : "");

      emitOpenChange(false);
      setDesktopOpen(false);

      requestAnimationFrame(() => {
        setAddressSheetOpen(true);
      });
    },
    [emitOpenChange, onChange, placesSafe, t, value],
  );

  const confirmAddress = React.useCallback(() => {
    const addr = oneLine(pendingAddress);
    if (!addr) return;
    onChange({ ...value, isDesired: true, location: String(pendingKey), address: addr });
    setAddressSheetOpen(false);
    resetPending();
  }, [onChange, pendingAddress, pendingKey, resetPending, value]);

  React.useEffect(() => {
    if (!selectedKey) return;
    if (!selectedNeedAddress && oneLine(String((value as any)?.address || "")).length > 0) {
      onChange({ ...value, isDesired: false, address: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNeedAddress, selectedKey]);

  const mobileCommittedAddress = oneLine(String((value as any)?.address || ""));

  const buttonLabel = selectedPlace
    ? isMobile && selectedNeedAddress
      ? mobileCommittedAddress
        ? t("trigger.selectedWithAddress", {
            place: String((selectedPlace as any)?.title ?? ""),
            address: shortText(mobileCommittedAddress),
          })
        : t("trigger.selectedNeedsAddress", {
            place: String((selectedPlace as any)?.title ?? ""),
            addressLabel,
          })
      : String((selectedPlace as any)?.title ?? "")
    : fallbackPlaceholder;

  const isShowingPlaceholder = !selectedPlace;

  // ✅ placeholderClassName اعمال میشه روی هر دو حالت mobile و desktop
  const triggerTextClass = isShowingPlaceholder
    ? cn("truncate text-gray-500", placeholderClassName)
    : "truncate text-gray-800";

  const TriggerButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full justify-between h-12 rounded-lg bg-transparent border-gray-300 text-gray-600",
        triggerClassName,
      )}
    >
      <span className={triggerTextClass}>
        {buttonLabel}
      </span>
      <ChevronsUpDown size={18} className="text-gray-500" />
    </Button>
  );

  const DesktopAddressInline =
    !isMobile && selectedNeedAddress ? (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-600 text-right">{addressLabel}</Label>
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
          <span>{t("address.requiredHint")}</span>
        </div>
      </div>
    ) : null;

  // ---------------- Mobile UI ----------------
  const MobileHeader = (
    <div className="shrink-0 border-b bg-white dark:bg-gray-800">
      <div className="px-4 py-4 flex items-center">
        <button
          type="button"
          onClick={() => emitOpenChange(false)}
          className="flex items-center gap-2 justify-center rounded-full hover:bg-gray-100"
          aria-label={t("a11y.back")}
        >
          <ArrowRight size={20} className="text-gray-700" />
          <div className="mx-2 font-bold text-gray-900 text-right">{title}</div>
        </button>
      </div>
    </div>
  );

  const MobileList = (
    <div className="space-y-2 p-4">
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
              "rounded-lg border bg-white transition-colors cursor-pointer select-none",
              checked ? "border-blue-200" : "border-gray-200",
              "hover:bg-gray-50",
            )}
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 wrap-break-word whitespace-normal leading-snug">
                  {String((item as any)?.title ?? "")}
                  {needAddress && (
                    <ChevronLeft
                      size={14}
                      className="inline-block align-middle text-amber-600 mr-1"
                      strokeWidth={3}
                    />
                  )}
                </p>
              </div>

              <div className="shrink-0 text-left">
                {isFree ? (
                  <div className="text-[11px] flex gap-1">
                    <p className="text-gray-500">هزینه:</p>
                    <p className="font-bold">{t("common.free")}</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-[11px] text-gray-500">هزینه: </span>
                    <span className="text-sm font-bold text-gray-900">
                      {priceNum.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-500">{currencyLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {checked && needAddress && oneLine(String((value as any)?.address || "")).length > 0 ? (
              <div className="px-3 pb-3">
                <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
                  <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-500">{t("address.savedTitle")}</div>
                    <div className="text-xs text-gray-800 break-words whitespace-normal leading-relaxed">
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
          aria-label={t("a11y.back")}
        >
          <ArrowRight size={20} className="text-gray-700" />
        </button>
        <div className="flex-1 mr-2">
          <div className="font-extrabold text-gray-900 text-right truncate">
            {pendingTitle || t("address.defaultLabel")}
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
          <span>{t("address.requiredHint")}</span>
        </div>
      </div>
      <Button
        type="button"
        className="w-full h-12 rounded-xl font-extrabold"
        disabled={oneLine(pendingAddress).length === 0}
        onClick={confirmAddress}
      >
        {t("actions.save")}
      </Button>
    </div>
  );

  if (isMobile) {
    const needsAddrAndEmpty =
      Boolean(selectedPlace) &&
      Boolean(selectedNeedAddress) &&
      oneLine(String((value as any)?.address || "")).length === 0;

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
                ? needsAddrAndEmpty ? "text-gray-500" : "text-gray-800"
                : cn("text-gray-500", placeholderClassName),
            )}
          >
            {buttonLabel}
          </span>
          <ChevronsUpDown size={18} className="text-gray-500" />
        </Button>

        <Sheet open={mobileOpen} onOpenChange={emitOpenChange}>
          <SheetContent
            showCloseButton={false}
            side="right"
            style={SHEET_STYLE}
            className="overflow-hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", width: "100%" }}>
              {MobileHeader}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full">{MobileList}</ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet
          open={addressSheetOpen}
          onOpenChange={(v) => (v ? setAddressSheetOpen(true) : closeAddress())}
        >
          <SheetContent
            showCloseButton={false}
            side="right"
            style={SHEET_STYLE}
            className="overflow-hidden"
          >
            <div className="flex flex-col overflow-hidden" style={{ height: "100dvh", width: "100%" }}>
              {AddressMobileHeader}
              <div className="flex-1 min-h-0 overflow-auto">{AddressMobileContent}</div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

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
              <CommandEmpty>{t("rows.empty")}</CommandEmpty>
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
                        <div className="flex items-center gap-1.5">
                          {needAddress && (
                            <ChevronLeft size={16} className="text-amber-600 shrink-0" strokeWidth={3} />
                          )}
                          <span className="font-semibold text-gray-900">
                            {String((item as any)?.title ?? "")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isFree
                            ? t("common.free")
                            : t("common.priceWithCurrency", {
                                price: priceNum.toLocaleString(),
                                currency: currencyLabel,
                              })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!isFree && (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-bold text-gray-900">
                              {priceNum.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-gray-500">{currencyLabel}</span>
                          </div>
                        )}
                        {isFree && <p>{t("common.free")}</p>}
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