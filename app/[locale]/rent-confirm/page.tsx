/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Check, CreditCard, Wallet, FileText, Share2, Calendar, MapPin, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Header from "@/components/layouts/Header"
import Footer from "@/components/Footer"

type Step = "SUCCESS_SUBMITTED" | "PAYMENT_DETAILS" | "PAYMENT_SUCCESS" | "DOCUMENT_CHECKLIST"

export default function ReservationFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("SUCCESS_SUBMITTED")
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "ON_SITE" | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])

  const handleDocUpload = (docId: string) => {
    if (!uploadedDocs.includes(docId)) {
      setUploadedDocs([...uploadedDocs, docId])
    }
  }

  const isDocsComplete = uploadedDocs.includes("id-card") && uploadedDocs.includes("license")

  return (
    <div className="min-h-screen bg-background text-foreground dir-rtl" dir="rtl">
      <Header />

      <main className="container mx-auto max-w-7xl py-12 px-4 md:px-6">
        {/* Step 1: Request Submitted */}
        {currentStep === "SUCCESS_SUBMITTED" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
                <Check className="w-10 h-10 stroke-[3px]" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">درخواست شما با موفقیت ثبت شد</h1>
              <p className="text-muted-foreground text-lg max-w-7xl mx-auto leading-relaxed">
                کارشناسان PalmRent در حال بررسی مدارک و وضعیت خودرو انتخابی شما هستند. تاییدیه نهایی تا ۳ دقیقه آینده از
                طریق پیامک ارسال خواهد شد.
              </p>
            </div>

            {/* Enhanced Progress Visualizer */}
            <div className="grid grid-cols-3 gap-6 py-6">
              {[
                { label: "ثبت اولیه", status: "completed" },
                { label: "تایید نهایی", status: "current" },
                { label: "تحویل خودرو", status: "pending" },
              ].map((step, i) => (
                <div key={i} className="space-y-4">
                  <div className="relative h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-0 transition-all duration-1000",
                        step.status === "completed"
                          ? "bg-primary"
                          : step.status === "current"
                            ? "bg-primary/40 animate-pulse"
                            : "bg-transparent",
                      )}
                    />
                  </div>
                  <p
                    className={cn(
                      "text-xs font-medium uppercase tracking-tighter text-center",
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>

            <Card className="bg-muted/50 border-none shadow-sm rounded-3xl">
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1 text-center md:text-right">
                  <p className="text-sm text-muted-foreground">کد پیگیری رزرو</p>
                  <p className="text-3xl font-mono font-bold tracking-wider">PR-8829-DXB</p>
                </div>
                <Button
                  onClick={() => setCurrentStep("PAYMENT_DETAILS")}
                  size="lg"
                  className="w-full md:w-auto px-10 h-14 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  تایید و پرداخت بیعانه
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {currentStep === "PAYMENT_DETAILS" && (
          <div className="grid md:grid-cols-5 gap-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="md:col-span-3 space-y-8">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep("SUCCESS_SUBMITTED")}
                className="group -mr-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span>بازگشت</span>
              </Button>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">تایید و پرداخت</h2>
                <p className="text-muted-foreground">لطفاً جزئیات رزرو خود را بررسی و روش پرداخت را انتخاب کنید.</p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-lg">انتخاب روش پرداخت</h4>
                <div className="grid gap-4">
                  {[
                    {
                      id: "ONLINE",
                      title: "پرداخت آنلاین",
                      icon: CreditCard,
                      desc: "تخفیف ۵٪ برای پرداخت‌های آنلاین",
                      badge: "پیشنهادی",
                    },
                    {
                      id: "ON_SITE",
                      title: "پرداخت در محل (دبی)",
                      icon: Wallet,
                      desc: "امکان پرداخت نقدی یا با کارت هنگام تحویل",
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 text-right transition-all duration-200",
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 bg-card",
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          paymentMethod === method.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{method.title}</p>
                          {method.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {method.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          paymentMethod === method.id ? "border-primary" : "border-muted-foreground/30",
                        )}
                      >
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                disabled={!paymentMethod}
                onClick={() => setCurrentStep("PAYMENT_SUCCESS")}
                className="w-full h-16 rounded-2xl text-xl font-bold shadow-xl transition-all"
              >
                پرداخت نهایی
              </Button>
            </div>

            <div className="md:col-span-2">
              <Card className="sticky top-24 overflow-hidden border-none bg-muted/40 rounded-[2.5rem]">
                <div className="relative aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800"
                    alt="Luxury Car"
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 border-none">
                    LUXURY CLASS
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl font-bold">Lamborghini Huracán</CardTitle>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">روزانه</p>
                      <p className="text-xl font-bold">۱,۲۰۰ AED</p>
                    </div>
                  </div>
                  <CardDescription>مدل ۲۰۲۴ - رنگ مشکی مات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Separator className="bg-border/50" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">تاریخ تحویل</span>
                      </div>
                      <p className="font-bold text-sm">۱۴ تیر - ۱۰:۰۰</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">محل تحویل</span>
                      </div>
                      <p className="font-bold text-sm">دبی، دبی مال</p>
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">هزینه اجاره (۳ روز)</span>
                      <span className="font-semibold">۳,۶۰۰ AED</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">مالیات و عوارض</span>
                      <span className="font-semibold">۱۸۰ AED</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t">
                      <span className="font-bold text-lg">مبلغ کل</span>
                      <span className="text-2xl font-bold tracking-tighter text-primary">۳,۷۸۰ AED</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Payment Success */}
        {currentStep === "PAYMENT_SUCCESS" && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 text-center">
            <div className="space-y-4">
              <div className="relative inline-flex mb-4">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground relative z-10 shadow-xl">
                  <Check className="w-12 h-12 stroke-[3px]" />
                </div>
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">پرداخت با موفقیت انجام شد</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                رسید دیجیتال و تاییدیه نهایی برای شما ایمیل شد. اکنون می‌توانید مدارک خود را برای تحویل سریع‌تر بارگذاری
                کنید.
              </p>
            </div>

            <Card className="rounded-3xl border-2 border-dashed bg-card/50 p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">شماره تراکنش</p>
                  <p className="font-mono font-bold text-lg">#PLM-7712390</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    مبلغ پرداخت شده
                  </p>
                  <p className="font-bold text-lg">۳,۷۸۰ AED</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 font-semibold bg-transparent">
                  <FileText className="w-4 h-4" />
                  دانلود رسید (PDF)
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl gap-2 font-semibold bg-transparent">
                  <Share2 className="w-4 h-4" />
                  اشتراک‌گذاری
                </Button>
              </div>
            </Card>

            <Button
              onClick={() => setCurrentStep("DOCUMENT_CHECKLIST")}
              className="w-full h-16 rounded-2xl text-xl font-bold shadow-xl"
            >
              مرحله بعد: بارگذاری مدارک
            </Button>
          </div>
        )}

        {/* Step 4: Document Checklist */}
        {currentStep === "DOCUMENT_CHECKLIST" && (
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">بارگذاری مدارک</h2>
              <p className="text-muted-foreground">
                برای تسریع در فرآیند تحویل خودرو در دبی، لطفاً تصاویر مدارک زیر را ارسال نمایید.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { id: "id-card", title: "تصویر پاسپورت یا کارت شناسایی", icon: FileText, required: true },
                { id: "license", title: "گواهینامه رانندگی معتبر", icon: CreditCard, required: true },
                { id: "resident", title: "ویزای توریستی یا اقامت", icon: MapPin, required: false },
              ].map((doc) => (
                <Card
                  key={doc.id}
                  className={cn(
                    "rounded-2xl transition-all duration-300 overflow-hidden",
                    uploadedDocs.includes(doc.id)
                      ? "border-primary/20 bg-primary/5"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                          uploadedDocs.includes(doc.id)
                            ? "bg-primary text-primary-foreground scale-110 shadow-md"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {uploadedDocs.includes(doc.id) ? (
                          <Check className="w-7 h-7" />
                        ) : (
                          <doc.icon className="w-7 h-7" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-lg">{doc.title}</p>
                          {doc.required && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                              الزامی
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۱۰ مگابایت)
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={uploadedDocs.includes(doc.id) ? "secondary" : "outline"}
                      onClick={() => handleDocUpload(doc.id)}
                      disabled={uploadedDocs.includes(doc.id)}
                      className={cn(
                        "rounded-xl px-8 h-12 font-bold w-full sm:w-auto shrink-0",
                        uploadedDocs.includes(doc.id) && "opacity-50",
                      )}
                    >
                      {uploadedDocs.includes(doc.id) ? "بارگذاری شد" : "انتخاب فایل"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-8 border-t flex flex-col gap-6">
              <Button
                disabled={!isDocsComplete}
                size="lg"
                className="w-full h-16 rounded-2xl text-xl font-bold shadow-xl disabled:opacity-50"
                onClick={() => alert("مدارک شما با موفقیت ثبت شد. تیم ما در دبی منتظر شماست!")}
              >
                تکمیل فرآیند رزرو
              </Button>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-xs font-medium">تمامی مدارک شما به صورت رمزنگاری شده و امن نگهداری می‌شوند.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
