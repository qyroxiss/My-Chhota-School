import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'unpdf', '@napi-rs/canvas'],
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
    // The proxy layer caps request bodies at 10MB by default, which truncates
    // multi-file uploads. Raise it for large PDFs (images are also compressed
    // client-side before upload).
    proxyClientMaxBodySize: '30mb',
  },
};

export default nextConfig;
