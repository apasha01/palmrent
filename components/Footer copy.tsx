/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronDown, Phone, Mail, MessageCircle, MessageSquare } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

type FooterLinkItem = {
  label: string;
  href: string;
};

type ContactLinkItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function AccordionSection({ title, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] pb-4" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FooterLinkList({ items }: { items: FooterLinkItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={`${item.label}-${item.href}`} className="flex items-center gap-2">
          <Link
            href={item.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>

          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-border"
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}

function FooterContactList({ items }: { items: ContactLinkItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <li key={`${item.label}-${item.href}`}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center">
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");

  const quickLinks: FooterLinkItem[] = [
    { label: t("links.home"), href: "/" },
    { label: t("links.carRent"), href: "/cars-rent" },
    { label: t("links.faq"), href: "/faq" },
    { label: t("links.rentalRules"), href: "/rules" },
    { label: t("links.aboutUs"), href: "/about-us" },
  ];

  const branchLinks: FooterLinkItem[] = [
    { label: t("branches.dubai"), href: "/cars-rent/dubai" },
    { label: t("branches.istanbul"), href: "/cars-rent/turkey" },
    { label: t("branches.oman"), href: "/cars-rent/oman" },
  ];

  const moreLinks: FooterLinkItem[] = [
    { label: t("more.aboutPalmRent"), href: "/about-us" },
    { label: t("more.gallery"), href: "/gallery" },
    { label: t("more.faq"), href: "/faq" },
    { label: t("more.rentalRules"), href: "/rental-rules" },
  ];

  const mobileQuickLinks: FooterLinkItem[] = [
    { label: t("links.carRent"), href: "/cars-rent" },
    { label: t("links.faq"), href: "/faq" },
    { label: t("links.rentalRules"), href: "/rental-rules" },
    { label: t("links.aboutUs"), href: "/about-us" },
    { label: t("links.contactUs"), href: "/contact-us" },
  ];

  const mobileBranchLinks: FooterLinkItem[] = [
    { label: t("branches.dubai"), href: "/cars-rent/dubai" },
    { label: t("branches.istanbul"), href: "/cars-rent/turkey" },
    { label: t("branches.oman"), href: "/cars-rent/oman" },
    { label: t("branches.allBranches"), href: "/cars-rent" },
  ];

  const mobileMoreLinks: FooterLinkItem[] = [
    { label: t("more.aboutPalmRent"), href: "/about-us" },
    { label: t("more.gallery"), href: "/gallery" },
    { label: t("more.rentalRules"), href: "/rental-rules" },
  ];

  const contactLinks: ContactLinkItem[] = [
    {
      label: t("contact.whatsapp"),
      href: "/contact-us?type=whatsapp",
      icon: MessageCircle,
    },
    {
      label: t("contact.phone"),
      href: "/contact-us?type=phone",
      icon: Phone,
    },
    {
      label: t("contact.email"),
      href: "/contact-us?type=email",
      icon: Mail,
    },
    {
      label: t("contact.contactUs"),
      href: "/contact-us",
      icon: MessageSquare,
    },
  ];

  return (
    <footer className="mt-4 mb-4 border-t text-foreground lg:mb-4">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1300px] px-6 py-6 lg:block">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-0">
          {/* Col 1 */}
          <div className="flex flex-col px-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight">
                {t("brand")}
              </span>

              <img
                src="/images/logo.png"
                alt={t("brand")}
                className="h-5 w-15 dark:filter-none"
              />
            </div>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {t("description")}
            </p>

        
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 2 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">{t("sections.quickAccess")}</h3>
            <FooterLinkList items={quickLinks} />

         
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 3 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">{t("sections.importantBranches")}</h3>
            <FooterLinkList items={branchLinks} />

            <div className="mt-1 flex">
              <Link
                href="/cars-rent"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                {t("branches.allBranches")}
              </Link>
            </div>
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 4 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">{t("sections.contactPalmRent")}</h3>
            <FooterContactList items={contactLinks} />
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 5 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">{t("sections.moreInfo")}</h3>
            <FooterLinkList items={moreLinks} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <AccordionSection title={t("sections.quickAccess")}>
          <div className="px-6">
            <FooterLinkList items={mobileQuickLinks} />
          </div>
        </AccordionSection>

        <AccordionSection title={t("sections.importantBranches")}>
          <div className="px-6">
            <FooterLinkList items={mobileBranchLinks} />
          </div>
        </AccordionSection>

        <AccordionSection title={t("sections.contactPalmRent")}>
          <div className="px-6">
            <FooterContactList items={contactLinks} />
          </div>
        </AccordionSection>

        <AccordionSection title={t("sections.moreInfo")}>
          <div className="px-6">
            <FooterLinkList items={mobileMoreLinks} />
          </div>
        </AccordionSection>
      </div>

      <div className="mb-4 border-t py-2 text-center text-xs text-muted-foreground lg:mb-0">
        {t("copyright")}
      </div>
    </footer>
  );
}