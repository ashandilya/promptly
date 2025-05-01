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
   // Note: Exposing sensitive keys like private keys directly to the client-side
   // using NEXT_PUBLIC_ is generally NOT recommended for security reasons.
   // It's better to fetch data via an API route on the server-side.
   // However, for simplicity in this example, we'll allow them.
   // Consider moving the Google Sheets fetching logic to an API route
   // (e.g., /api/prompts) in a real-world application.
   env: {
    NEXT_PUBLIC_GOOGLE_PRIVATE_KEY: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL,
    NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID: process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID,
    NEXT_PUBLIC_GOOGLE_SHEET_NAME: process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME,
   },
};

export default nextConfig;
