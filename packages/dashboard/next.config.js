/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CORE_API_URL: process.env.CORE_API_URL,
    CHAT_SDK_CDN_URL: process.env.CHAT_SDK_CDN_URL,
  },
  async rewrites() {
    return [
      {
        source: "/api/core/:path*",
        destination: `${
          process.env.CORE_API_URL || "http://localhost:3001"
        }/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
