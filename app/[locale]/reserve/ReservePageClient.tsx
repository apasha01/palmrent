/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import ReserveInformation from "@/components/reserve/ReserveInformation";
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store";

type Props = {
  branchId: number;
  carId: number;
  from: string;
  to: string;
  dt: string;
  rt: string;
  initialApiData?: any;
};

export default function ReservePageClient({
  branchId,
  carId,
  from,
  to,
  dt,
  rt,
  initialApiData,
}: Props) {
  useEffect(() => {
    const st: any = useSearchPageStore.getState();

    if (typeof st?.setRoadMapStep === "function") st.setRoadMapStep(3);
    if (typeof st?.setBranchId === "function") st.setBranchId(branchId);
    if (typeof st?.setSelectedCarId === "function") st.setSelectedCarId(carId);
    if (typeof st?.setCarDates === "function") st.setCarDates([from, to]);
    if (typeof st?.setDeliveryTime === "function") st.setDeliveryTime(dt);
    if (typeof st?.setReturnTime === "function") st.setReturnTime(rt);
  }, [branchId, carId, from, to, dt, rt]);

  return <ReserveInformation initialApiData={initialApiData} />;
}