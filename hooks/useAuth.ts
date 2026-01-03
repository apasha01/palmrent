/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession, signOut } from "next-auth/react";
import { toast } from "react-toastify";

export function useAuth() {
  const { data, status } = useSession();
  console.log( data?.user );

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = isAuthenticated ? (data as any)?.user ?? null : null;

  // ✅ اگر لازم شد توکن هم در دسترس
  const accessToken = isAuthenticated ? (data as any)?.accessToken ?? null : null;

  const logout = async () => {
    toast.success("خارج شدید، به امید دیدار مجدد 👋");
    await signOut({ redirect: true, callbackUrl: "/login" });
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
