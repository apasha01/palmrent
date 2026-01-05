"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Trash2 } from "lucide-react";

export function UploadCard() {
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  return (
    // ✅ wrapper برای وسط‌چین کردن کارت
    <div className="w-full flex justify-center px-3 mt-6">
      <Card className="w-full max-w-md border border-border bg-card overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        {/* progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <div className="h-full bg-primary w-full transition-all duration-700 ease-in-out" />
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-4">
            <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
              ID: #TRX-8821
            </Badge>
            <span className="text-[10px] text-muted-foreground font-bold tracking-widest">
              پنل کاربری
            </span>
          </div>

          <CardTitle className="text-2xl font-black text-right">
            بارگذاری مدارک
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center pb-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              پرداخت موفقیت‌آمیز بود
            </Badge>

            <div className="text-right space-y-2 w-full">
              <h3 className="text-xl font-bold text-foreground">
                مدارک مورد نیاز
              </h3>
              <p className="text-sm text-muted-foreground">
                لطفاً مدارک را جهت تکمیل پرونده آپلود کنید.
              </p>

              {/* dropzone */}
              <div
                className="mt-6 p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group text-center"
                onClick={() =>
                  setFiles([{ name: "national_card.jpg", size: "1.2 MB" }])
                }
              >
                <UploadCloud className="h-10 w-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-medium text-primary">
                  فایل‌ها را به اینجا بکشید یا کلیک کنید
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  (JPG/PNG/PDF - حداکثر ۱۰MB)
                </p>
              </div>

              {/* files list */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-background border border-border rounded-lg animate-in fade-in slide-in-from-right-2"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div className="text-right">
                          <p className="text-xs font-bold truncate max-w-[180px]">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.size}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setFiles([])}
                        aria-label="remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* action buttons */}
              <div className="mt-4 flex gap-2">
                <Button className="flex-1 font-bold">
                  ارسال مدارک
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 font-bold"
                  onClick={() => setFiles([])}
                  disabled={files.length === 0}
                >
                  پاک کردن
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3">
                بعد از آپلود، وضعیت بررسی از همین صفحه قابل پیگیری است.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
