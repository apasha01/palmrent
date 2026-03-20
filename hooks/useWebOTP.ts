/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

export function useWebOTP(
  onCode: (code: string) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();

    const options = {
      otp: { transport: ["sms"] },
      signal: ac.signal,
    } as any;

    navigator.credentials
      .get(options)
      .then((credential: any) => {
        if (credential?.code) {
          onCode(String(credential.code));
        }
      })
      .catch(() => {
        // abort یا unsupported — silent
      });

    return () => ac.abort();
  }, [enabled]);
}