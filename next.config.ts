import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
