"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock3 } from "lucide-react"

export function ProcessingCard() {
  return (
    <div className="flex items-center justify-center mt-4">
      <Card className="w-full max-w-md relative">
        {/* progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
          <div className="h-full bg-primary w-1/3 transition-all duration-700 ease-in-out" />
        </div>

        <CardHeader>
          <CardTitle className="text-2xl font-black text-right">
            وضعیت سفارش شما
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              {/* چرخش آروم */}
              <Clock3 className="h-10 w-10 text-primary animate-spin [animation-duration:3.5s]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                در حال بررسی سفارش
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                سفارش شما انجام شد و کارشناسان در حال تایید هستند.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
