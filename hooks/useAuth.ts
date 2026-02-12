/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = isAuthenticated ? (data as any)?.user ?? null : null;
  const accessToken = isAuthenticated ? (data as any)?.accessToken ?? null : null;

  // ✅ logout بدون ریدایرکت (پیش‌فرض)
  const logout = async () => {
    await signOut({ redirect: false });
    router.refresh(); // ✅ کمک به sync UI در App Router
  };

  return {
    status,
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    ...(user ?? {}),
    logout,
  };
}
