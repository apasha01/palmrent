"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle } from "lucide-react"

export function FailedCard() {
  return (
    <Card
      className="w-full max-w-md border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-card overflow-hidden relative"
      
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive/20">
        <div className="h-full bg-destructive w-full shadow-[0_0_10px_rgba(var(--destructive),0.5)]" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
            ID: #TRX-8821
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest">خطا</span>
        </div>
        <CardTitle className="text-2xl font-black text-right text-destructive">تراکنش ناموفق</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">خطا در پرداخت</h3>
            <p className="text-sm text-muted-foreground">
              متأسفانه تراکنش شما ناموفق بود. مبلغ کسر شده تا ۷۲ ساعت آینده بازگشت داده می‌شود.
            </p>
            <Button
              variant="outline"
              className="w-full mt-4 border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
            >
              تلاش مجدد
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
