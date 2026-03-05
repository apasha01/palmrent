/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

export function useAuth() {
  const { data, status, update } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = isAuthenticated ? (data as any)?.user ?? null : null;
  const accessToken = isAuthenticated ? (data as any)?.accessToken ?? null : null;

  const logout = async () => {
    await signOut({ redirect: false });
    router.refresh();
  };

  const setSessionUser = async (nextUser: any) => {
    // next-auth update => session callback دوباره اجرا میشه
    await update({
      user: nextUser,
      accessToken,
    } as any);

    // این اختیاریه، بعضی وقتا برای RSC کمک می‌کنه
    router.refresh();
  };

  return {
    status,
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    ...(user ?? {}),
    logout,
    setSessionUser,
  };
}
