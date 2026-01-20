"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { PhoneCall } from "lucide-react";
import { IconWhatsapp } from "../Icons";

type Props = {
  onlySupportView?: boolean;

  // ✅ شماره‌ها از بیرون (اگر ندادی، دیفالت پایین اعمال میشه)
  whatsappNumber?: string | null;
  phoneNumber?: string | null;
};

function sanitizePhone(input?: string | null) {
  if (!input) return "";
  const digits = String(input).replace(/[^\d]/g, "");
  if (!digits || digits === "0") return "";
  return digits;
}

function buildWhatsAppUrl(raw?: string | null) {
  const phone = sanitizePhone(raw);
  if (!phone) return "";
  return `https://wa.me/${phone}`;
}

function buildTelUrl(raw?: string | null) {
  const phone = sanitizePhone(raw);
  if (!phone) return "";
  return `tel:${phone}`;
}

const ImportantQuestions = ({
  onlySupportView,
  whatsappNumber = "989211284055",
  phoneNumber = "02191097811",
}: Props) => {
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber);
  const telUrl = buildTelUrl(phoneNumber);

  const whatsappDisabled = !whatsappUrl;
  const telDisabled = !telUrl;

  return (
    <div>
      {!onlySupportView && (
        <>
          <p className="md:block px-4 font-bold mb-4 mt-1 text-gray-900 dark:text-gray-100">
            سوالات متداول
          </p>

          <div className="bg-white dark:bg-gray-900 shadow rounded-3xl">
            <div className="p-4 m-0!">
              <p className="font-bold hidden md:block text-lg text-center text-gray-900 dark:text-gray-100">
                سوالات متداول
              </p>

              <div className="mt-2">
                <Tabs defaultValue="delivary">
                  <div className="flex justify-end md:justify-center">
                    <TabsList className="bg-transparent p-0! m-0! gap-2">
                      <TabsTrigger
                        value="general"
                        className="px-4 py-2
                          data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/40
                          data-[state=active]:border-blue-500
                          data-[state=active]:shadow-none
                          data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400
                          border border-gray-400 dark:border-gray-700
                          bg-transparent shadow-none
                          text-gray-600 dark:text-gray-300"
                      >
                        تحویل و عودت
                      </TabsTrigger>

                      <TabsTrigger
                        value="delivary"
                        className="px-4 py-2
                          data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/40
                          data-[state=active]:border-blue-500
                          data-[state=active]:shadow-none
                          data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400
                          border border-gray-400 dark:border-gray-700
                          bg-transparent shadow-none
                          text-gray-600 dark:text-gray-300"
                      >
                        عمومی
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="general" className="mt-5">
                    <Accordion type="single" collapsible>
                      <AccordionItem
                        value="item-1"
                        className="border-b border-gray-200 dark:border-gray-800"
                      >
                        <AccordionTrigger className="text-gray-900 dark:text-gray-100">
                          چگونه میتوانم در پالم رنت خودرو رزرو کنم؟
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 dark:text-gray-300">
                          <p>...</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="delivary" className="mt-5">
                    <Accordion type="single" collapsible>
                      <AccordionItem
                        value="item-1"
                        className="border-b border-gray-200 dark:border-gray-800"
                      >
                        <AccordionTrigger className="text-gray-900 dark:text-gray-100">
                          چرا میتوانم به پالم رنت اعتماد کنم؟
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 dark:text-gray-300">
                          <p>...</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ بخش پایین */}
      <div className="mt-6 px-4 md:px-0">
        <div className="p-5 bg-white dark:bg-gray-900 shadow rounded-xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-right">
              <p className="font-bold md:font-medium text-gray-900 dark:text-gray-100">
                سوالی دارید ؟ از ما بپرسید!
              </p>

              <p className="text-gray-600 dark:text-gray-300 text-xs">
                پشتیبانی و همراهی ۲۴ ساعته پالم رنت
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {/* ✅ واتساپ */}
              {whatsappDisabled ? (
                <Button
                  variant="outline-success"
                  className="flex-1 md:flex-none"
                  disabled
                >
                  <IconWhatsapp className={undefined} />
                  مشاوره واتساپ
                </Button>
              ) : (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none"
                >
                  <Button
                    variant="outline-success"
                    className="w-full"
                    type="button"
                  >
                    <IconWhatsapp className={undefined} />
                    مشاوره واتساپ
                  </Button>
                </a>
              )}

              {/* ✅ تماس */}
              {telDisabled ? (
                <Button
                  variant="outline-primary"
                  className="flex items-center flex-1 md:flex-none"
                  disabled
                >
                  <PhoneCall />
                  مشاوره تلفنی
                </Button>
              ) : (
                <a href={telUrl} className="flex-1 md:flex-none">
                  <Button
                    variant="outline-primary"
                    className="w-full flex items-center"
                    type="button"
                  >
                    <PhoneCall />
                    مشاوره تلفنی
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportantQuestions;
