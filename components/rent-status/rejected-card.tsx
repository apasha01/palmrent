"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export function RejectedCard() {
  return (
    <Card
      className="w-full max-w-md border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-card overflow-hidden relative"
      
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500/20">
        <div className="h-full bg-orange-500 w-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
            ID: #TRX-8821
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest">هشدار</span>
        </div>
        <CardTitle className="text-2xl font-black text-right text-orange-500">درخواست رد شد</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-500">
          <div className="h-16 w-16 bg-orange-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">عدم تایید مدارک</h3>
            <p className="text-sm text-muted-foreground">
              متأسفانه مدارک یا درخواست شما توسط کارشناسان تایید نشد. جهت اطلاعات بیشتر با پشتیبانی تماس بگیرید.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
