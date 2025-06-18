/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: '/api/:route*',
      headers: [
        { key: 'Content-Type', value: 'text/plain' },
      ]
    }]
  }
};

export default nextConfig;
