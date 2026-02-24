// /src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ intlRes رو مستقیم برمیگردونیم — فقط x-pathname اضافه میکنیم
  // دلیل: next-intl داخل intlRes هم headers و هم cookies locale رو set میکنه
  // اگه NextResponse.next() جدید بسازیم، اون cookies گم میشن
  // و هر بار locale reset میشه به defaultLocale (fa)
  const intlRes = intlMiddleware(req);

  intlRes.headers.set("x-pathname", pathname);

  return intlRes;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};