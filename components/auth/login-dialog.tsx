/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { toast } from "react-toastify"
import { Phone, ArrowRight, Smartphone, Loader2, RefreshCcw, ShieldCheck } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

import { otpRequest } from "@/services/auth/auth.api"
import UserAvatarPopover from "./UserAvatarPopover"
import { useAuth } from "@/hooks/useAuth"

export default function LoginDialog() {
  const { isAuthenticated } = useAuth()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"mobile" | "otp">("mobile")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  if (isAuthenticated) return <UserAvatarPopover />

  const validMobile = /^09\d{9}$/.test(mobile)

  const sendOtp = async () => {
    if (!validMobile) {
      toast.error("لطفاً شماره موبایل معتبر وارد کنید")
      return
    }
    setLoading(true)
    try {
      await otpRequest(mobile)
      toast.success("کد تایید ارسال شد")
      setStep("otp")
      setCooldown(60)
    } catch (e: any) {
      toast.error(e.message ?? "خطا در برقراری ارتباط")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (code: string) => {
    if (code.length !== 5) return
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        mobile,
        code,
      })

      if (!res?.ok) {
        toast.error("کد وارد شده صحیح نیست")
        setOtp("")
        return
      }

      toast.success("خوش آمدید! ورود با موفقیت انجام شد")
      setOpen(false)

      setTimeout(() => {
        setStep("mobile")
        setMobile("")
        setOtp("")
      }, 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-full border-primary/20 hover:bg-primary/5 transition-all duration-300"
      >
        ورود / عضویت سریع
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-140 p-0 overflow-hidden border-none rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-2xl">
          <DialogTitle className="sr-only">ورود به پنل کاربری</DialogTitle>

          <div className="p-8 sm:p-12 text-center space-y-10">
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] scale-110 animate-pulse" />
              <div className="relative bg-primary text-primary-foreground p-5 rounded-[1.75rem] shadow-xl shadow-primary/20 ring-1 ring-white/20">
                {step === "mobile" ? (
                  <Smartphone className="h-8 w-8" />
                ) : (
                  <ShieldCheck className="h-8 w-8 animate-in zoom-in duration-500" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                {step === "mobile" ? "خوش آمدید" : "تایید هویت"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed px-6">
                {step === "mobile"
                  ? "شماره همراه خود را وارد کنید تا کد تایید برای شما ارسال شود"
                  : `کد ۵ رقمی ارسال شده به شماره ${mobile} را وارد کنید`}
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {step === "mobile" ? (
                <div className="space-y-6">
                  <div className="relative group">
                    <Input
                      dir="ltr"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="0912 XXX XXXX"
                      maxLength={11}
                      className="h-14 text-center text-xl font-medium tracking-[0.2em] rounded-2xl bg-secondary/30 border-transparent focus:border-primary/20 focus:bg-background transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>

                  <Button
                    disabled={!validMobile || loading}
                    onClick={sendOtp}
                    className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "دریافت کد تایید"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-10 flex flex-col items-center">
                  <InputOTP
                    dir="ltr"
                    maxLength={5}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val)
                      if (val.length === 5) verifyOtp(val)
                    }}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-3" dir="ltr">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-14 h-16 bg-gray-200 dark:bg-gray-800 text-2xl font-semibold shadow-inner transition-all border-2 border-transparent focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 "
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="w-full space-y-4">
                    <Button
                      variant="ghost"
                      disabled={cooldown > 0 || loading}
                      onClick={sendOtp}
                      className="w-full h-12 rounded-xl font-medium gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <RefreshCcw className={cn("h-4 w-4", cooldown > 0 && "animate-spin-slow opacity-40")} />
                      {cooldown > 0 ? (
                        <span className="tabular-nums">ارسال مجدد کد ({cooldown})</span>
                      ) : (
                        "ارسال دوباره کد"
                      )}
                    </Button>

                    <button
                      onClick={() => setStep("mobile")}
                      className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                      ویرایش شماره همراه
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
