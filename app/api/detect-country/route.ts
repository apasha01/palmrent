import { headers } from "next/headers";
import { NextResponse } from "next/server";

type IpWhoResponse = {
  success?: boolean;
  ip?: string;
  country?: string;
  country_code?: string;
  type?: string;
  continent?: string;
  continent_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_eu?: boolean;
  postal?: string;
  calling_code?: string;
  capital?: string;
  borders?: string;
  flag?: {
    img?: string;
    emoji?: string;
    emoji_unicode?: string;
  };
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  timezone?: {
    id?: string;
    abbr?: string;
    is_dst?: boolean;
    offset?: number;
    utc?: string;
    current_time?: string;
  };
  message?: string;
};

export async function GET() {
  const logPrefix = "[api/detect-country]";

  try {
    const h = await headers();

    const forwardedFor = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");
    const cfConnectingIp = h.get("cf-connecting-ip");
    const userAgent = h.get("user-agent");
    const host = h.get("host");
    const referer = h.get("referer");

    const ip =
      forwardedFor?.split(",")[0]?.trim() ||
      realIp?.trim() ||
      cfConnectingIp?.trim() ||
      "";

    console.log(`${logPrefix} request started`);
    console.log(`${logPrefix} host:`, host);
    console.log(`${logPrefix} referer:`, referer);
    console.log(`${logPrefix} user-agent:`, userAgent);
    console.log(`${logPrefix} x-forwarded-for:`, forwardedFor);
    console.log(`${logPrefix} x-real-ip:`, realIp);
    console.log(`${logPrefix} cf-connecting-ip:`, cfConnectingIp);
    console.log(`${logPrefix} resolved ip:`, ip || "not-found");

    if (!ip) {
      console.warn(`${logPrefix} no ip found, fallback => us`);

      return NextResponse.json(
        {
          country: "us",
          source: "fallback-no-ip",
          ip: null,
        },
        { status: 200 },
      );
    }

    const lookupUrl = `https://ipwho.is/${ip}`;

    console.log(`${logPrefix} calling provider:`, lookupUrl);

    const res = await fetch(lookupUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`${logPrefix} provider status:`, res.status, res.statusText);

    if (!res.ok) {
      console.error(`${logPrefix} provider request failed, fallback => us`);

      return NextResponse.json(
        {
          country: "us",
          source: "fallback-provider-http-error",
          ip,
        },
        { status: 200 },
      );
    }

    const data: IpWhoResponse = await res.json();

    console.log(`${logPrefix} provider response:`, JSON.stringify(data, null, 2));

    if (data.success && data.country_code) {
      const country = data.country_code.toLowerCase();

      console.log(`${logPrefix} detected country:`, country);

      return NextResponse.json(
        {
          country,
          source: "ipwhois",
          ip,
          countryName: data.country ?? null,
          city: data.city ?? null,
          region: data.region ?? null,
        },
        { status: 200 },
      );
    }

    console.warn(
      `${logPrefix} provider did not return valid country, fallback => us`,
    );

    return NextResponse.json(
      {
        country: "us",
        source: "fallback-invalid-provider-data",
        ip,
        providerMessage: data.message ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/detect-country] unexpected error:", error);

    return NextResponse.json(
      {
        country: "us",
        source: "fallback-exception",
        ip: null,
      },
      { status: 200 },
    );
  }
}