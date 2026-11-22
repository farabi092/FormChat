import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const everywhere = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];

    const noFraming = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    ];

    return [
      { source: "/:path*", headers: everywhere },
      { source: "/dashboard/:path*", headers: noFraming },
      { source: "/login", headers: noFraming },
      { source: "/signup", headers: noFraming },
    ];
  },
};

export default nextConfig;