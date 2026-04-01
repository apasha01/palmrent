/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";

type CheckReserveParams = {
  carId: number;
  locale: string;
  branchId: number;
  from: string;
  to: string;
  dt: string;
  rt: string;
};

function getBaseApiUrl() {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXTFRONTEND_API_URL ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:8000/api";

  return base.replace(/\/+$/, "");
}

function extractReservePayload(raw: any) {
  if (!raw || typeof raw !== "object") return null;

  if (raw?.item) return raw;
  if (raw?.data?.item) return raw.data;
  if (raw?.data && typeof raw.data === "object") return raw.data;

  return raw;
}

function getResponseStatus(res: Response, raw: any) {
  return Number(raw?.status ?? raw?.data?.status ?? res.status);
}

export async function checkReserveOr404({
  carId,
  locale,
  branchId,
  from,
  to,
  dt,
  rt,
}: CheckReserveParams) {
  const baseUrl = getBaseApiUrl();

  const params = new URLSearchParams();
  params.append("branch_id", String(branchId));
  params.append("from", from);
  params.append("to", to);
  params.append("dt", dt);
  params.append("rt", rt);

  const url = `${baseUrl}/car/rent/${carId}/${locale}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 404) {
    notFound();
  }

  let raw: any = null;

  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  const status = getResponseStatus(res, raw);

  if (status === 404) {
    notFound();
  }

  if (!res.ok && status !== 200) {
    throw new Error(
      raw?.message ||
        raw?.data?.message ||
        `Reserve precheck failed with status ${status || res.status}`,
    );
  }

  const payload = extractReservePayload(raw);

  if (!payload?.item) {
    notFound();
  }

  return payload;
}