import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/tv-terminal",

  images: {
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "927907.selcdn.ru",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "826d0f1c-f5de-47aa-b1a1-a0190a1d5c7c.selstorage.ru",
      },
    ],
  },
};

export default nextConfig;
