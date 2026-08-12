/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // 低内存环境避免多 worker 编译 OOM
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
