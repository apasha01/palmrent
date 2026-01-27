"use client"

import React, { useMemo } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconPerson } from "./Icons"

type UserRow = {
  id: number | string
  name: string
  phone?: string
  email?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (user: UserRow) => void
  users?: UserRow[]
}

export default function InfoListDialog({ open, onOpenChange, onSelect, users }: Props) {
  const t = useTranslations()

  const data = useMemo<UserRow[]>(() => {
    if (Array.isArray(users) && users.length) return users
    return [
      {
        id: 1,
        name: "کاربر مهمان",
        phone: "971000000000",
        email: "guest@example.com",
      },
    ]
  }, [users])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("p-0 overflow-hidden w-[92vw] max-w-105 rounded-2xl")}>
        <DialogHeader className="px-4 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-sm font-bold text-gray-800">
              {t("chooseInfoTitle")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 flex flex-col gap-3">
            {data.length > 0 ? (
              data.map((u) => (
                <button
                  key={String(u.id)}
                  type="button"
                  onClick={() => {
                    onSelect?.(u)
                    onOpenChange(false)
                  }}
                  className={cn(
                    "w-full",
                    "bg-gray-50 text-gray-700 rounded-xl p-3",
                    "border border-gray-200",
                    "hover:border-blue-400 hover:bg-blue-50",
                    "transition-all flex items-center gap-3"
                  )}
                >
                  <div className="bg-white p-2 rounded-full border border-gray-100 shadow-sm">
                    <IconPerson  />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-gray-800 truncate">
                      {u.name}
                    </span>
                    {u.phone ? (
                      <span className="text-xs text-gray-500 truncate">{u.phone}</span>
                    ) : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
                <IconPerson  />
                <span>اطلاعاتی یافت نشد</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
