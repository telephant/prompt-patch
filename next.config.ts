import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // enable static export
  images: {
    unoptimized: true, // close image optimization
  },
};

export default nextConfig;
