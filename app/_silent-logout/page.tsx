"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SilentLogoutPage() {
  useEffect(() => {
    const next = sessionStorage.getItem("__next_after_logout") || "/";
    sessionStorage.removeItem("__next_after_logout");

    // سشن رو پاک کن بدون redirect
    signOut({ redirect: false })
      .catch(() => {})
      .finally(() => {
        // بعد از پاک شدن سشن، برو مقصد
        window.location.replace(next);
      });
  }, []);

  return null; // هیچی نمایش نده
}
