import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The invitation letter PDF reads these from public/ with fs at request time,
  // which the file tracer cannot see — without this the function deploys
  // without its Devanagari font and every letter fails to render.
  outputFileTracingIncludes: {
    "/api/events/namo-sewa-samman-2026/register": [
      "./public/fonts/**/*",
      "./public/logo.png",
      "./public/logo-email.png",
      "./public/signature-president.png",
    ],
  },
};

export default nextConfig;
