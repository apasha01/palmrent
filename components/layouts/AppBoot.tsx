"use client";

import { useSession } from "next-auth/react";

export default function AppBoot({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  
  if (status === "loading") {
    return null; // یا return <>{children}</>;
  }

  return <>{children}</>;
}