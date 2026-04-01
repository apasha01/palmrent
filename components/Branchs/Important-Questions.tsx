import { useTranslations } from "next-intl";
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
  onlySupportView = false,
  whatsappNumber = "989211284055",
  phoneNumber = "02191097811",
}: Props) => {
  const t = useTranslations("ImportantQuestions");

  const whatsappUrl = buildWhatsAppUrl(whatsappNumber);
  const telUrl = buildTelUrl(phoneNumber);

  const whatsappDisabled = !whatsappUrl;
  const telDisabled = !telUrl;

  return (
    <div>
      {!onlySupportView && (
        <section aria-labelledby="important-questions-title">
          <>
            <h2
              id="important-questions-title"
              className="md:block px-4 font-bold mb-4 mt-1 text-gray-900 dark:text-gray-100"
            >
              {t("faqTitle")}
            </h2>

            <div className="bg-white dark:bg-gray-900 border shadow rounded-3xl">
              <div className="p-4">
                <h3 className="font-bold hidden md:block text-lg text-center text-gray-900 dark:text-gray-100">
                  {t("faqTitle")}
                </h3>

                <div className="mt-2">
                  <Tabs defaultValue="delivery">
                    <div className="flex justify-end md:justify-center">
                      <TabsList className="bg-transparent p-0 gap-2" aria-label={t("faqTitle")}>
                        <TabsTrigger
                          value="delivery"
                          className="
                            px-2 py-2
                            data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/40
                            data-[state=active]:border-blue-500
                            data-[state=active]:shadow-none
                            data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400
                            border border-gray-400 dark:border-gray-700
                            bg-transparent shadow-none
                            text-gray-600 dark:text-gray-300
                          "
                        >
                          {t("tabs.delivery")}
                        </TabsTrigger>

                        <TabsTrigger
                          value="general"
                          className="
                            px-4 py-2
                            data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/40
                            data-[state=active]:border-blue-500
                            data-[state=active]:shadow-none
                            data-[state=active]:text-blue-500 dark:data-[state=active]:text-blue-400
                            border border-gray-400 dark:border-gray-700
                            bg-transparent shadow-none
                            text-gray-600 dark:text-gray-300
                          "
                        >
                          {t("tabs.general")}
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="delivery" className="mt-5">
                      <Accordion type="single" collapsible>
                        <AccordionItem
                          value="delivery-1"
                          className="border-b border-gray-200 dark:border-gray-800"
                        >
                          <AccordionTrigger className="text-gray-900 dark:text-gray-100">
                            {t("delivery.q1.title")}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 dark:text-gray-300">
                            <p>{t("delivery.q1.body")}</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>

                    <TabsContent value="general" className="mt-5">
                      <Accordion type="single" collapsible>
                        <AccordionItem
                          value="general-1"
                          className="border-b border-gray-200 dark:border-gray-800"
                        >
                          <AccordionTrigger className="text-gray-900 dark:text-gray-100">
                            {t("general.q1.title")}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600 dark:text-gray-300">
                            <p>{t("general.q1.body")}</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </>
        </section>
      )}

<section
  className="mt-6 md:px-0"
  aria-labelledby="important-questions-support-title"
>
  <div className="p-4 bg-white dark:bg-gray-900 shadow border rounded-xl">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-right">
        <h2
          id="important-questions-support-title"
          className="font-bold md:font-medium text-gray-900 dark:text-gray-100"
        >
          {t("support.title")}
        </h2>

        <p className="text-gray-600 dark:text-gray-300 text-xs">
          {t("support.subtitle")}
        </p>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {whatsappDisabled ? (
          <Button
            variant="outline-success"
            className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-base"
            disabled
            aria-disabled="true"
          >
            <IconWhatsapp aria-hidden="true" className={undefined} />
            {t("support.whatsapp")}
          </Button>
        ) : (
          <Button
            asChild
            variant="outline-success"
            className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-base"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("support.whatsappAria")}
            >
              <IconWhatsapp aria-hidden="true" className={undefined} />
              {t("support.whatsapp")}
            </a>
          </Button>
        )}

        {telDisabled ? (
          <Button
            variant="outline-primary"
            className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-base"
            disabled
            aria-disabled="true"
          >
            <PhoneCall className="mr-2" aria-hidden="true" />
            {t("support.phone")}
          </Button>
        ) : (
          <Button
            asChild
            variant="outline-primary"
            className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-base"
          >
            <a href={telUrl} aria-label={t("support.phoneAria")}>
              <PhoneCall className="mr-2" aria-hidden="true" />
              {t("support.phone")}
            </a>
          </Button>
        )}
      </div>
    </div>
  </div>
</section>
    </div>
  );
};

export default ImportantQuestions;