/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React from "react";

export default function ReservationLayout({ children }: any) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
