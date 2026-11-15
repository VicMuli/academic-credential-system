const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:4000/api').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiBaseUrl}/:path*` }];
  }
};

export default nextConfig;
