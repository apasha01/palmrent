import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

export const config = {
  matcher: [
    // همه مسیرها به جز:
    // - api
    // - _next
    // - فایل‌های استاتیک مثل .png .css ...
    // - login
    // - _silent-logout  (برای logout بی‌صدا)
    // - api/auth (NextAuth)
    "/((?!api|_next|.*\\..*|login|_silent-logout|api/auth).*)",
  ],
};
