/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import useDIR from "@/hooks/use-rtl";

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
  categories?: CategoryItem[];
  loading?: boolean;
}

const BranchFaq = ({ categories = [], loading = false }: Props) => {
  const t = useTranslations("BranchFaq");
  const { language } = useDIR();

  if (loading) {
    return (
      <div>
        <p className="mt-1 mb-4 px-4 font-bold text-gray-900 dark:text-gray-100 md:block">
          {t("yourQuestions")}
        </p>

        <div className="rounded-3xl border bg-white shadow dark:bg-gray-900">
          <div className="p-4">
            <p className="hidden text-center text-lg font-bold text-gray-900 dark:text-gray-100 md:block">
              {t("commonQuestions")}
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("loading")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validCategories = categories.filter(
    (category) =>
      category &&
      Array.isArray(category.questions) &&
      category.questions.length > 0,
  );

  if (!validCategories.length) {
    return (
      <div>
        <p className="mt-1 mb-4 px-4 font-bold text-gray-900 dark:text-gray-100 md:block">
          {t("yourQuestions")}
        </p>

        <div className="rounded-3xl border bg-white shadow dark:bg-gray-900">
          <div className="p-4">
            <p className="hidden text-center text-lg font-bold text-gray-900 dark:text-gray-100 md:block">
              {t("commonQuestions")}
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("empty")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const defaultTab = String(validCategories[0].id);

  return (
    <div>
      <p className="mt-1 mb-4 px-4 font-bold text-gray-900 dark:text-gray-100 md:block">
        {t("yourQuestions")}
      </p>

      <div className="rounded-3xl border bg-white shadow dark:bg-gray-900">
        <div className="p-2">
          {/* <p className="hidden text-center text-lg font-bold text-gray-900 dark:text-gray-100 md:block">
            {t("commonQuestions")}
          </p> */}

          <div className="mt-2 px-2">
            <Tabs defaultValue={defaultTab}>
              <div className="flex justify-start overflow-x-auto pb-2 md:justify-center">
                <TabsList className="min-w-max gap-2 bg-transparent p-0">
                  {validCategories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={String(category.id)}
                      className="
                        whitespace-nowrap rounded-xl px-4 py-2
                        border border-gray-300 dark:border-gray-700
                        bg-transparent text-gray-600 shadow-none dark:text-gray-300
                        data-[state=active]:border-blue-500
                        data-[state=active]:bg-blue-50
                        data-[state=active]:text-blue-500
                        data-[state=active]:shadow-none
                        dark:data-[state=active]:bg-blue-950/40
                        dark:data-[state=active]:text-blue-400
                      "
                    >
                      {category.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {validCategories.map((category) => (
                <TabsContent key={category.id} value={String(category.id)}>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((q) => (
                      <AccordionItem
                        key={q.id}
                        value={`question-${category.id}-${q.id}`}
                        className="border-b border-gray-200 dark:border-gray-800"
                      >
                        <AccordionTrigger
                          className=" text-gray-900 hover:no-underline dark:text-gray-100"
                          aria-label={t("openQuestion", { question: q.question })}
                        >
                          <div className="flex w-full items-center gap-2 text-right">
                            <HelpCircle className="h-5 w-5 shrink-0 text-blue-500 dark:text-blue-400" />
                            <span className="leading-7">{q.question}</span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="text-gray-600 dark:text-gray-300">
                          <div
                            className="
                              prose prose-sm max-w-none leading-7
                              dark:prose-invert
                              prose-p:my-2
                              prose-ul:my-2
                              prose-ol:my-2
                              prose-li:my-1
                              prose-a:text-blue-600
                              dark:prose-a:text-blue-400
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

export default BranchFaq;