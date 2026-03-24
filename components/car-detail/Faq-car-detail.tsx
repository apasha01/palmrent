/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

type FaqItem = {
  id: number;
  question: string;
  answer: string; // HTML
  sort?: number;
  source?: "car" | "branch" | string;
};

function isValidFaq(x: any): x is FaqItem {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "number" &&
    typeof x.question === "string" &&
    x.question.trim().length > 0 &&
    typeof x.answer === "string" &&
    x.answer.trim().length > 0
  );
}

export default function FAQcardetail({ faqs }: { faqs?: any[] }) {
  const t = useTranslations("faq");

  const items: FaqItem[] = Array.isArray(faqs) ? faqs.filter(isValidFaq) : [];
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  return (
    <div>
      <p className="font-bold px-4 md:px-2 lg:px-0 text-gray-900 dark:text-gray-100">
        {t("title")}
      </p>

      <div className="w-full mt-4 px-4 md:px-0">
        <Accordion type="single" collapsible className="w-full space-y-3">
          {sorted.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={`faq-${faq.id}`}
              className="
                w-full
                dark:bg-gray-900
                rounded-xl
                border border-gray-200 dark:border-gray-800
                shadow-sm dark:shadow-none
                px-3
              "
            >
              <AccordionTrigger className="w-full text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-2 text-right">
                  <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>{faq.question}</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="text-right text-sm leading-6 text-gray-600 dark:text-gray-300">
                <div
                  className="prose prose-sm max-w-none text-right dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}