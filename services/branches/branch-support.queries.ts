/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { getBranchSupport } from "./branchDetail";


export const useBranchSupport = (
  locale: string,
  branchId?: number | null
) => {
  return useQuery<any>({
    queryKey: ["branch-support", locale, branchId],
    queryFn: () => getBranchSupport(locale, Number(branchId)),
    enabled: !!branchId && branchId > 0,
    staleTime: 1000 * 60 * 5,
  });
};