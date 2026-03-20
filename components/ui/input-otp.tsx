"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      dir="ltr"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      data-slot="input-otp"
      containerClassName={cn(
        // مهم: کانتینر لاتر + جلوگیری از اثر RTL والد
        "flex items-center gap-2 has-disabled:opacity-50",
        "ltr:direction-ltr rtl:direction-ltr",
        containerClassName
      )}
      className={cn(
        // مهم‌ترین بخش برای جلوگیری از RTL:
        // direction + unicode-bidi باعث میشه caret و ترتیب ورود LTR بمونه
        "disabled:cursor-not-allowed",
        "[direction:ltr] [unicode-bidi:plaintext]",
        className
      )}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      dir="ltr"
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      dir="ltr"
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // ✅ همون دیزاین خودت + ردیوس‌ها حفظ
        "dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50",
        "aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      <span className="[direction:ltr] [unicode-bidi:plaintext] tabular-nums">
        {char}
      </span>

      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" dir="ltr" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
