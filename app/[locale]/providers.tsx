/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/components/ReduxProvider";

import { Slide, ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import AppBoot from "@/components/layouts/AppBoot";
import ReactQueryProvider from "@/providers/ReactQuery-provider";

// ✅ shadcn/radix direction
import { DirectionProvider } from "@radix-ui/react-direction";
import { MobileSheetProvider } from "@/providers/mobile-sheet-provider";

const RTL_LOCALES = new Set(["fa", "ar"]);

export default function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  const dir: "rtl" | "ltr" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  return (
    <SessionProvider>
      <ReduxProvider>
        <ReactQueryProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {/* ✅ Radix direction for shadcn components */}
            <DirectionProvider dir={dir}>
              <MobileSheetProvider>

              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick={false}
                rtl={isRtl}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Slide}
              />

              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <AppBoot>{children}</AppBoot>
              </ThemeProvider>

              </MobileSheetProvider>
            </DirectionProvider>
          </NextIntlClientProvider>
        </ReactQueryProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}