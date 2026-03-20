"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginDialog from "@/components/auth/login-dialog";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");

    if (callbackUrl) {
      router.replace(callbackUrl);
    } else {
      router.back();
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <LoginDialog
      open
      hideTrigger
      hideWhenAuthenticated
      showCloseButton={false}
      closeOnOutsideClick={false}
    />
  );
}