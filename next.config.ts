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
   // Note: While the Google Sheets fetching now happens server-side via a Server Action,
   // these environment variables are still prefixed with NEXT_PUBLIC_.
   // For improved security, if these variables are *only* used server-side,
   // remove the NEXT_PUBLIC_ prefix from both here and your .env file(s).
   // Access them directly via `process.env.YOUR_VARIABLE_NAME` in the server action.
   env: {
    NEXT_PUBLIC_GOOGLE_PRIVATE_KEY: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL,
    NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID: process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID,
    NEXT_PUBLIC_GOOGLE_SHEET_NAME: process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME,
   },
};

export default nextConfig;
