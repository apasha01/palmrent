"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, FileText, Trash2 } from "lucide-react"

export function UploadCard() {
  const [files, setFiles] = useState<{ name: string; size: string }[]>([])

  return (
    <Card
      className="w-full max-w-md border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-card overflow-hidden relative"
      
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
        <div className="h-full bg-primary w-full transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
            ID: #TRX-8821
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest">پنل کاربری</span>
        </div>
        <CardTitle className="text-2xl font-black text-right">وضعیت سفارش شما</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">پرداخت موفقیت‌آمیز بود</Badge>
          <div className="text-center space-y-2 w-full">
            <h3 className="text-xl font-bold text-foreground">بارگذاری مدارک</h3>
            <p className="text-sm text-muted-foreground">لطفاً مدارک مورد نیاز را جهت تکمیل پرونده آپلود کنید.</p>
            <div
              className="mt-6 p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
              onClick={() => setFiles([{ name: "national_card.jpg", size: "1.2 MB" }])}
            >
              <UploadCloud className="h-10 w-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-medium text-primary">فایل‌ها را به اینجا بکشید یا کلیک کنید</p>
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-card border rounded-lg animate-in fade-in slide-in-from-right-2"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="text-right">
                        <p className="text-xs font-bold truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setFiles([])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
