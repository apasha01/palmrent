/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpVerify } from "@/services/auth/auth.api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        mobile: { label: "mobile", type: "text" },
        code: { label: "code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = (credentials?.mobile ?? "").toString().trim();
        const code = (credentials?.code ?? "").toString().trim();

        if (!mobile || !code) return null;

        // پاسخ بک‌اند: انتظار { access_token: string, user: {...} }
        const data = await otpVerify(mobile, code);

        if (!data?.access_token) return null;

        const backendUser = data?.user ?? {};

        // ✅ کاربر را فلت برگردان (بدون user توی user)
        // NextAuth الزاماً id می‌خواهد
        const flatUser = {
          ...(backendUser as any),
          id: String((backendUser as any)?.id ?? mobile),
          mobile: (backendUser as any)?.mobile ?? mobile,
        };

        // چیزی که از authorize برمی‌گردانی، به jwt callback به عنوان `user` می‌آید
        return {
          ...flatUser,
          accessToken: data.access_token,
        } as any;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // user فقط هنگام signIn وجود دارد
      if (user) {
        // ✅ accessToken جدا
        token.accessToken = (user as any).accessToken;

        // ✅ user فلت (بدون accessToken داخلش)
        const { accessToken, ...rest } = user as any;
        token.user = rest;
      }
      return token;
    },

    async session({ session, token }) {
      // ✅ session.user = user فلت
      (session as any).user = (token as any).user ?? null;

      // ✅ session.accessToken = توکن
      (session as any).accessToken = (token as any).accessToken ?? null;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
