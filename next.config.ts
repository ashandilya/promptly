import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Environment variables are now accessed directly server-side (process.env.VAR_NAME)
  // and should be configured in your hosting environment (e.g., Vercel, Netlify)
  // and/or your local .env file. Remove the env block here.
  // env: {
  //  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  //  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  //  GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID,
  //  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME,
  // },
};

export default nextConfig;
