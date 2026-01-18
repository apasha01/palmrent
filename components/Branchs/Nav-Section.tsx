/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React from "react";
import { Label } from "../ui/label";
import { CalendarRange, Clock, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DateRangePickerPopover } from "../custom/calender/date-range-picker";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import useDIR from "@/hooks/use-rtl";

/** بیرون از render */
function DateTrigger() {
  return (
    <div className="flex items-center border h-10 rounded-md w-full overflow-hidden bg-transparent">
      <div className="flex items-center px-2 gap-1 w-1/2">
        <Clock className="text-gray-500" size={22} />
        <p className="text-gray-500 truncate">دبی</p>
      </div>

      <Separator orientation="vertical" />

      <div className="flex items-center px-2 gap-1.5 w-1/2">
        <CalendarRange className="text-gray-500" size={22} />
        <p className="text-gray-500 truncate">دبی</p>
      </div>
    </div>
  );
}

function MobileFloatLabel({ text }: { text: string }) {
  return (
    <span className="pointer-events-none rounded-t-md absolute right-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-600 dark:bg-gray-900 ">
      {text}
    </span>
  );
}

const NavSection = ({ image, title, subtitle1, subtitle2 }: any) => {
  const a = useDIR();
  console.log(a.direction);

  return (
    <section className="w-full">
      <div className="relative w-full h-80 md:h-80 lg:h-96">
        <Image
          alt="headpicture"
          src={image}
          fill
          priority
          className="object-cover rounded-b-lg md:rounded-none"
        />

        <div className="absolute inset-0 flex items-start justify-center pt-10 md:pt-0 md:items-center">
          <div className="w-full max-w-6xl px-4 text-center z-10">
            <div className="flex flex-col gap-2">
              <p className="text-xl md:text-2xl text-white font-bold">
                {title}
              </p>

              <p className="text-muted-foreground font-light text-sm mt-2">
                {subtitle1}
              </p>

              <p className="text-muted-foreground font-light text-sm">
                {subtitle2}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-3 px-4 z-10 md:hidden">
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <MobileFloatLabel text="شهر" />
              <Select onValueChange={(value) => console.log(value)}>
                <SelectTrigger className="w-full h-10 bg-white border-6 border-white p-1 dark:bg-gray-900 dark:border-gray-900">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">سلام</SelectItem>
                  <SelectItem value="1">1سلام</SelectItem>
                  <SelectItem value="2">2سلام</SelectItem>
                  <SelectItem value="3">3سلام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="relative w-full">
                <MobileFloatLabel text="تاریخ و زمان تحویل" />
                <DateRangePickerPopover
                  trigger={
                    <div className="bg-white rounded-md w-full dark:bg-gray-900">
                      <DateTrigger />
                    </div>
                  }
                />
              </div>

              <div className="relative w-full">
                <MobileFloatLabel text="تاریخ و زمان عودت" />
                <DateRangePickerPopover
                  trigger={
                    <div className="bg-white rounded-md w-full dark:bg-gray-900 ">
                      <DateTrigger />
                    </div>
                  }
                />
              </div>
            </div>

            <Button className="w-full h-10">
              <div className="flex items-center justify-center gap-2 px-3">
                <Search className="size-4.5" />
                جستجوی خودروها
              </div>
            </Button>
          </div>
        </div>

        <div className="hidden md:block absolute w-full left-0 -bottom-14 z-10">
          <div className="flex justify-center px-4">
            <div className="bg-white dark:bg-gray-900 shadow rounded-md p-4 max-w-6xl w-full">
              <div className="grid grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>شهر</Label>
                  <Select onValueChange={(value) => console.log(value)}>
                    <SelectTrigger className="w-full h-10!">
                      <SelectValue placeholder="شهر را انتخاب کنید" />
                    </SelectTrigger>

                    <SelectContent className="w-fit">
                      <SelectItem value="0">سلام</SelectItem>
                      <SelectItem value="1">1سلام</SelectItem>
                      <SelectItem value="2">2سلام</SelectItem>
                      <SelectItem value="3">3سلام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>تاریخ و زمان تحویل</Label>
                  <DateRangePickerPopover trigger={<DateTrigger />} />
                </div>

                <div className="space-y-2">
                  <Label>تاریخ و زمان عودت</Label>
                  <DateRangePickerPopover trigger={<DateTrigger />} />
                </div>

                <div className="space-y-2">
                  <Label className="opacity-0 select-none">جستجو</Label>
                  <Button className="w-full h-10">
                    <div className="flex items-center justify-center gap-2 px-3">
                      <Search className="size-4.5" />
                      جستجوی خودروها
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block h-20" />
    </section>
  );
};

export default NavSection;
