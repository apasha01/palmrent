/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"

export const useRTL = (): boolean => {
  const [isRTL, setIsRTL] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if document direction is RTL
    const direction = document.documentElement.dir || document.body.dir
    setIsRTL(direction === "rtl")
  }, [])

  // تا زمانی که mount نشده، false برگردون
  if (!mounted) {
    return false
  }

  return isRTL
}
