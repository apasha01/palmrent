/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is missing");
}

type VerifyPayload = {
  success: boolean;
  message?: string | null;
  data?: {
    access_token?: string;
    expires_in?: number;
    user?: any;
  };
};

export const authOptions: NextAuthOptions = {
  providers: [
    // ---------------- OTP ----------------
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        mobile: { label: "mobile", type: "text" },
        code: { label: "code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = (credentials?.mobile ?? "").toString().trim();
        const code = (credentials?.code ?? "").toString().trim();
        if (!mobile || !code) return null;

        try {
          const { data } = await axios.post<VerifyPayload>(
            `${API_BASE_URL.replace(/\/$/, "")}/auth/otp/verify`,
            { mobile, code },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
            }
          );

          if (!data?.success) throw new Error(data?.message || "OTP_VERIFY_FAILED");

          const accessToken = data?.data?.access_token;
          const user = data?.data?.user;
          if (!accessToken || !user) throw new Error("OTP_VERIFY_FAILED");

          return {
            ...(user as any),
            id: String((user as any)?.id ?? mobile),
            mobile: (user as any)?.mobile ?? mobile,
            accessToken,
          } as any;
        } catch (e: any) {
          const backendMsg =
            e?.response?.data?.message ||
            e?.response?.data?.msg ||
            e?.message ||
            "OTP_VERIFY_FAILED";
          throw new Error(backendMsg);
        }
      },
    }),

    // ---------------- Token Login ----------------
    CredentialsProvider({
      id: "token",
      name: "Token",
      credentials: {
        accessToken: { label: "accessToken", type: "text" },
        user_id: { label: "user_id", type: "text" },
        username: { label: "username", type: "text" },
        phone: { label: "phone", type: "text" },
        name: { label: "name", type: "text" },
        email: { label: "email", type: "text" },
      },
      async authorize(credentials) {
        const accessToken = (credentials?.accessToken ?? "").toString().trim();
        if (!accessToken) return null;

        return {
          id: String(credentials?.user_id ?? credentials?.username ?? "token-user"),
          username: credentials?.username ?? "",
          phone: credentials?.phone ?? "",
          name: credentials?.name ?? "",
          email: credentials?.email ?? null,
          accessToken,
        } as any;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // ✅ موقع لاگین
      if (user) {
        token.accessToken = (user as any).accessToken ?? null;
        const { accessToken, ...rest } = user as any;
        token.user = rest;
      }

      // ✅ موقع useSession().update(...)
      if (trigger === "update" && session) {
        // session شکلش همون چیزیه که update(...) پاس میدی
        if ((session as any)?.user) token.user = (session as any).user;
        if ((session as any)?.accessToken) token.accessToken = (session as any).accessToken;
      }

      return token;
    },

    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken ?? null;
      (session as any).user = (token as any).user ?? null;
      return session;
    },
  },

  pages: { signIn: "/login" },
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
