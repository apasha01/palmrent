/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface QuestionItem {
  id: number;
  question: string;
  answer: string;
  status?: string;
  is_for_hub?: boolean;
  sort_order?: number;
}

interface CategoryItem {
  id: number;
  title: string;
  status?: string;
  sort_order?: number;
  questions: QuestionItem[];
}

interface Props {
  data?: CategoryItem[];
  loading?: boolean;
}

const FAQlanding = ({ data = [], loading = false }: Props) => {
  if (loading) return null;

  const categories = data.filter(
    (category) => category?.questions && category.questions.length > 0
  );

  if (!categories.length) return null;

  const defaultTab = String(categories[0].id);

  return (
    <div>
      <p className="md:block px-4 font-bold mb-4 mt-1 text-gray-900 dark:text-gray-100">
        پرسش‌های شما
      </p>

      <div className="bg-white dark:bg-gray-900 border shadow rounded-3xl">
        <div className="p-4">
          <p className="font-bold hidden md:block text-lg text-center text-gray-900 dark:text-gray-100">
            پرسش‌های متداول
          </p>

          <div className="mt-2">
            <Tabs defaultValue={defaultTab}>
              <div className="flex justify-start md:justify-center overflow-x-auto pb-2">
                <TabsList className="bg-transparent p-0 gap-2 min-w-max">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={String(category.id)}
                      className="
                        px-4 
                        data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/40
                        data-[state=active]:border-blue-500
                        data-[state=active]:shadow-none
                        data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400
                        border border-gray-300 dark:border-gray-700
                        bg-transparent shadow-none
                        text-gray-600 dark:text-gray-300
                        whitespace-nowrap
                      "
                    >
                      {category.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((category) => (
                <TabsContent
                  key={category.id}
                  value={String(category.id)}
                  className=""
                >
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((q) => (
                      <AccordionItem
                        key={q.id}
                        value={`question-${q.id}`}
                        className="border-b border-gray-200 dark:border-gray-800"
                      >
                        <AccordionTrigger className="text-gray-900 dark:text-gray-100 text-right hover:no-underline">
                          <div className="flex items-center gap-2 text-right">
                            <HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                            <span className="leading-7">{q.question}</span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="text-gray-600 dark:text-gray-300">
                          <div
                            className="
                              leading-7 text-sm
                              prose prose-sm max-w-none
                              dark:prose-invert
                              prose-p:my-2
                              prose-ul:my-2
                              prose-ol:my-2
                              prose-li:my-1
                              prose-a:text-blue-600 dark:prose-a:text-blue-400
                            "
                            dangerouslySetInnerHTML={{
                              __html: q.answer || "",
                            }}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQlanding;