/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    // ffmpeg-static's binary is loaded by path at runtime, so tracing can't
    // see it; list it for every route that processes video.
    outputFileTracingIncludes: {
      '/api/media': ['./node_modules/ffmpeg-static/ffmpeg'],
      '/api/media/[id]/process': ['./node_modules/ffmpeg-static/ffmpeg'],
    },
  },
};

export default nextConfig;
