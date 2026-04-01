/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Phone, Mail, MessageCircle, MessageSquare } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

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

const quickLinks = [
  { label: "صفحه اصلی", href: "/" },
  { label: "اجاره خودرو", href: "/" },
  { label: "سوالات متداول", href: "/" },
  { label: "قوانین اجاره", href: "/" },
  { label: "درباره ما", href: "/" },
];

const branchLinks = [
  { label: "اجاره خودرو در دبی", href: "/" },
  { label: "اجاره خودرو در استانبول", href: "/" },
  { label: "اجاره خودرو در عمان", href: "/" },
  { label: "اجاره خودرو در کردستان", href: "/" },
];

const moreLinks = [
  { label: "درباره پالم رنت", href: "/" },
  { label: "گالری تصاویر", href: "/" },
  { label: "سوالات متداول", href: "/" },
  { label: "قوانین اجاره", href: "/" },
];

const mobileQuickLinks = [
  { label: "اجاره خودرو", href: "/" },
  { label: "سوالات متداول", href: "/" },
  { label: "قوانین اجاره", href: "/" },
  { label: "درباره ما", href: "/" },
  { label: "تماس با ما", href: "/" },
];

const mobileBranchLinks = [
  { label: "اجاره خودرو در دبی", href: "/" },
  { label: "اجاره خودرو در استانبول", href: "/" },
  { label: "اجاره خودرو در عمان", href: "/" },
  { label: "مشاهده همه شعب", href: "/" },
];

const mobileMoreLinks = [
  { label: "درباره پالم رنت", href: "/" },
  { label: "گالری تصاویر", href: "/" },
  { label: "قوانین اجاره", href: "/" },
];

const contactLinks = [
  {
    label: "واتساپ",
    href: "/",
    icon: MessageCircle,
  },
  {
    label: "تماس تلفنی",
    href: "/",
    icon: Phone,
  },
  {
    label: "ایمیل",
    href: "/",
    icon: Mail,
  },
  {
    label: "تماس با ما",
    href: "/",
    icon: MessageSquare,
  },
];

function FooterLinkList({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <Link
            href={item.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

function FooterContactList() {
  return (
    <ul className="flex flex-col">
      {contactLinks.map((item) => {
        const Icon = item.icon;

        return (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg py-1 text-sm text-muted-foreground transition-colors"
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
  return (
    <footer className="mt-4 mb-4 border-t text-foreground lg:mb-4">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-[1300px] px-6 py-6 lg:block">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-0">
          {/* Col 1 */}
          <div className="flex flex-col px-6">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold tracking-tight">پالم‌رنت</span>
              <img
                src="/images/logo.png"
                alt="پالم‌رنت"
                className="h-5 w-15 filter-[invert(1)] dark:filter-none"
              />
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              پالم رنت مرجع اجاره خودرو با رزرو آنلاین، قیمت‌گذاری شفاف و پشتیبانی
              ۲۴ ساعته است. می‌توانید خودروهای متنوع را بررسی کنید و از طریق شعب
              مختلف، گزینه مناسب خودتان را انتخاب کنید.
            </p>

            <Link href="/" className="mt-auto">
              صفحه اصلی
            </Link>
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 2 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">دسترسی سریع</h3>
            <FooterLinkList items={quickLinks} />

            <Link href="/" className="mt-4">
              صفحه اصلی
            </Link>
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 3 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">شعب مهم</h3>
            <FooterLinkList items={branchLinks} />

            <div className="mt-1 flex">
              <Link
                href="/"
                className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                مشاهده همه شعب
              </Link>
            </div>
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 4 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">ارتباط با پالم رنت</h3>
            <FooterContactList />
          </div>

          <span className="w-px self-stretch bg-border" />

          {/* Col 5 */}
          <div className="flex flex-col gap-4 px-6">
            <h3 className="mb-2 text-base font-semibold">اطلاعات بیشتر</h3>
            <FooterLinkList items={moreLinks} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <AccordionSection title="دسترسی سریع">
          <div className="px-6">
            <FooterLinkList items={mobileQuickLinks} />
          </div>
        </AccordionSection>

        <AccordionSection title="شعب مهم">
          <div className="px-6">
            <FooterLinkList items={mobileBranchLinks} />
          </div>
        </AccordionSection>

        <AccordionSection title="ارتباط با پالم رنت">
          <div className="px-6">
            <FooterContactList />
          </div>
        </AccordionSection>

        <AccordionSection title="اطلاعات بیشتر">
          <div className="px-6">
            <FooterLinkList items={mobileMoreLinks} />
          </div>
        </AccordionSection>
      </div>

      <div className="border-t py-2 text-center text-xs text-muted-foreground mb-4 lg:mb-0">
        تمام حقوق برای پالم رنت محفوظ است.
      </div>
    </footer>
  );
}