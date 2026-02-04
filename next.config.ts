import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  env: {
    // NEXT_PUBLIC_API_URL: "https://temp.palmrentcar.com/api",
    // NEXT_PUBLIC_API_URL: "http://192.168.100.31:8000/api",
    NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api",
    NEXT_PUBLIC_STORAGE_URL: "https://cdn.palmrentcar.com/",

    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "9c2a7f4e1d8b0a6f3c5e9d2b7a1f4c8e6d0a5b9c7f3e1d8b2a4c6",
  },

  images: {
    // unoptimized: true,
    remotePatterns: [
            { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'commondatastorage.googleapis.com' },
      {
        protocol: "https",
        hostname: "cdn.palmrentcar.com",
        pathname: "/**",
      },

            {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
