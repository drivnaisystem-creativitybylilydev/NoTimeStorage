import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Disposition', value: 'attachment; filename="apple-developer-merchantid-domain-association"' },
        ],
      },
    ];
  },
};

export default nextConfig;
