/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/components/ReduxProvider";
import Toast from "@/components/Toast";
import { Slide, ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import AppBoot from "@/components/layouts/AppBoot";

export default function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    <SessionProvider>
      <ReduxProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Toast />

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick={false}
            rtl={locale === "fa" || locale === "ar"}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            transition={Slide}
          />

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppBoot>

            {children}
            </AppBoot>
          </ThemeProvider>
        </NextIntlClientProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}
