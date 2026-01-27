/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LocationState } from "@/types/rent-information";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ---------------- Types ----------------

type PlaceRow = {
  id: number | string;
  title: string;
  price_pay?: string | number;
  pre_price_pay?: string | number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  currencyLabel: string;

  places: PlaceRow[];

  value: LocationState;
  onChange: (next: LocationState) => void;

  allowDesired?: boolean;
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

// ---------------- Row (OUTSIDE render) ----------------
// ✅ اینجا آوردیم بیرون تا ارور “Cannot create components during render” رفع شه

type RowProps = {
  id: string;
  title: string;
  priceNum: number;
  isFree: boolean;

  selectedKey: string;
  currencyLabel: string;
  onSelect: (id: string) => void;
};

function LocationRow({
  id,
  title,
  priceNum,
  isFree,
  selectedKey,
  currencyLabel,
  onSelect,
}: RowProps) {
  const checked = selectedKey === id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(id);
      }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3",
        "hover:bg-gray-50 cursor-pointer select-none",
      )}
    >
      {/* RIGHT */}
      <div className="flex items-center gap-3 min-w-0">
        <Checkbox
        variant="info"
          checked={checked}
          onCheckedChange={() => onSelect(id)}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5"
        />

        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            هزینه:{" "}
            {isFree ? "رایگان" : `${priceNum.toLocaleString()} ${currencyLabel}`}
          </div>
        </div>
      </div>

      {/* LEFT */}
      <Badge variant="secondary" className="rounded-full whitespace-nowrap">
        {isFree ? "رایگان" : `${priceNum.toLocaleString()}`}
      </Badge>
    </div>
  );
}

// ---------------- Main Component ----------------

export default function ResponsiveLocationPicker({
  open,
  onOpenChange,
  title,
  currencyLabel,
  places,
  value,
  onChange,
  allowDesired = true,
}: Props) {
  const isMobile = useIsMobile(1024);

  // ✅ تک انتخابی
  const selectedKey = value?.isDesired
    ? "desired"
    : value?.location != null
      ? String(value.location)
      : "";

  const isDesiredChecked = selectedKey === "desired";

  const selectKey = React.useCallback(
    (key: string) => {
      if (key === "desired") {
        onChange({
          ...value,
          isDesired: true,
          location: "desired",
          address: value?.address || "",
        });
        return;
      }

      onChange({
        ...value,
        isDesired: false,
        location: String(key), // ✅ string ذخیره می‌کنیم
        address: "",
      });
    },
    [onChange, value],
  );

  // ✅ Header
  const Header = (
    <div className="shrink-0 px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="بازگشت"
          >
            <ArrowRight size={20} className="text-gray-700" />
          </button>

          <div className="font-bold text-gray-900">{title}</div>
        </div>

        <div className="w-9" />
      </div>
    </div>
  );

  // ✅ List Content (shared)
  const ListContent = (
    <div className="space-y-3">
      {(Array.isArray(places) ? places : []).map((item, index) => {
        const id = String((item as any)?.id ?? index);
        const priceNum = toPriceNumber((item as any)?.price_pay);
        const isFree = priceNum <= 0;

        return (
          <LocationRow
            key={id}
            id={id}
            title={String((item as any)?.title ?? "")}
            priceNum={priceNum}
            isFree={isFree}
            selectedKey={selectedKey}
            currencyLabel={currencyLabel}
            onSelect={selectKey}
          />
        );
      })}

      {allowDesired ? (
        <>
          <Separator className="my-2" />
          <LocationRow
            id="desired"
            title="سایر (آدرس دلخواه)"
            priceNum={0}
            isFree
            selectedKey={selectedKey}
            currencyLabel={currencyLabel}
            onSelect={selectKey}
          />
        </>
      ) : null}

      {allowDesired && isDesiredChecked ? (
        <div className="pt-2 space-y-1">
          <Label className="text-xs text-gray-500">آدرس دلخواه</Label>
          <Input
            value={value?.address || ""}
            onChange={(e) =>
              onChange({
                ...value,
                isDesired: true,
                location: "desired",
                address: e.target.value,
              })
            }
            placeholder="آدرس را وارد کنید"
            className="h-11 rounded-lg border-gray-300"
          />
        </div>
      ) : null}
    </div>
  );

  // ✅ Mobile: scroll + footer fixed
  const MobileBody = (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        {/* ✅ padding پایین برای اینکه زیر footer نره */}
        <div className={cn("p-4", "pb-40")}>{ListContent}</div>
      </ScrollArea>
    </div>
  );

  const MobileFooterFixed = (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-60",
        "border-t bg-white",
        "px-4 py-4 space-y-3",
        "pb-[calc(env(safe-area-inset-bottom)+16px)]",
      )}
    >
      <div className="text-[11px] text-gray-500 flex items-start gap-2">
        <Info size={14} className="mt-0.5 text-gray-400" />
        <span>بعد از انتخاب، روی «انجام شد» بزنید.</span>
      </div>

      <Button
        type="button"
        className="w-full h-12 rounded-xl font-extrabold"
        onClick={() => onOpenChange(false)}
      >
        انجام شد
      </Button>
    </div>
  );

  const MobilePage = (
    <div className="relative h-dvh w-full flex flex-col overflow-hidden">
      {Header}
      {MobileBody}
      {MobileFooterFixed}
    </div>
  );

  // ✅ Mobile Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton={false}
          side="right"
          className={cn(
            "p-0",
            "h-dvh w-screen max-w-none",
            "rounded-none border-0",
            "overflow-hidden",
          )}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          {MobilePage}
        </SheetContent>
      </Sheet>
    );
  }

  // ✅ Desktop Dialog + footer sticky
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-130 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="h-[70vh] flex flex-col">
          {Header}

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className={cn("p-4", "pb-28")}>{ListContent}</div>
            </ScrollArea>
          </div>

          <div className="shrink-0 border-t bg-white px-4 py-4 space-y-3">
            <div className="text-[11px] text-gray-500 flex items-start gap-2">
              <Info size={14} className="mt-0.5 text-gray-400" />
              <span>بعد از انتخاب، روی «انجام شد» بزنید.</span>
            </div>

            <Button
              type="button"
              className="w-full h-12 rounded-xl font-extrabold"
              onClick={() => onOpenChange(false)}
            >
              انجام شد
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
