// // /src/middleware.ts
// import createMiddleware from "next-intl/middleware";
// import { routing } from "./i18n/routing";
// import { NextRequest } from "next/server";

// const intlMiddleware = createMiddleware(routing);

// export default function middleware(req: NextRequest) {
//   const pathname = req.nextUrl.pathname;

//   const intlRes = intlMiddleware(req);

//   intlRes.headers.set("x-pathname", pathname);

//   return intlRes;
// }

// export const config = {
//   matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
// };


// /src/middleware.ts
// /src/middleware.ts
// /src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

type RedirectLookupResponse = {
  found: boolean;
  type?: number | null;
  destination?: string | null;
};

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  );
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function parseDestination(destination: string): { pathname: string; search: string } {
  try {
    // full URL
    if (/^https?:\/\//i.test(destination)) {
      const url = new URL(destination);
      return {
        pathname: normalizePath(url.pathname),
        search: url.search || "",
      };
    }

    // path یا path?query
    const fakeBase = new URL("http://localhost");
    const url = new URL(destination.startsWith("/") ? destination : `/${destination}`, fakeBase);

    return {
      pathname: normalizePath(url.pathname),
      search: url.search || "",
    };
  } catch {
    return {
      pathname: normalizePath(destination),
      search: "",
    };
  }
}

async function lookupRedirect(
  pathname: string,
): Promise<RedirectLookupResponse | null> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    if (!apiBaseUrl) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      return null;
    }

    const lookupUrl = new URL(`${apiBaseUrl}/redirects/lookup`);
    lookupUrl.searchParams.set("path", pathname);

    const res = await fetch(lookupUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("redirect lookup failed with status:", res.status);
      return null;
    }

    const data = (await res.json()) as RedirectLookupResponse;
    return data;
  } catch (error) {
    console.error("redirect lookup failed:", error);
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const pathname = normalizePath(req.nextUrl.pathname);

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const redirectData = await lookupRedirect(pathname);

  if (redirectData?.found) {
    const statusCode = Number(redirectData.type);

    if (statusCode === 410) {
      const res = new NextResponse(null, { status: 410 });
      res.headers.set("x-pathname", pathname);
      return res;
    }

    if (
      redirectData.destination &&
      [301, 302, 307, 308].includes(statusCode)
    ) {
      const currentPath = normalizePath(pathname);
      const target = parseDestination(redirectData.destination);

      if (currentPath !== target.pathname) {
        // خیلی مهم: origin همیشه از request فعلی گرفته می‌شود
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = target.pathname;
        redirectUrl.search = target.search || req.nextUrl.search;
        redirectUrl.hash = "";

        const response = NextResponse.redirect(redirectUrl, statusCode);
        response.headers.set("x-pathname", pathname);
        response.headers.set("x-redirect-final", redirectUrl.toString());
        return response;
      }
    }
  }

  const intlRes = intlMiddleware(req);
  intlRes.headers.set("x-pathname", pathname);
  return intlRes;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};