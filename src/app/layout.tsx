import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import Script from 'next/script'; // Import the Script component
import Head from 'next/head'; // Import Head for font preloading

export const metadata: Metadata = {
  title: 'Promptly Marketing', // Updated title
  description: 'A library of B2B marketing prompts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Added suppressHydrationWarning to mitigate hydration errors potentially caused by browser extensions or client-side specifics like Math.random()
    <html lang="en" suppressHydrationWarning>
      <Head>
        {/* Preload font files */}
        <link
          rel="preload"
          href="/fonts/StyreneB-Regular.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
         <link
          rel="preload"
          href="/fonts/StyreneB-Bold.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/StyreneB-Light.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        {/* Add other font weights/styles if needed */}
      </Head>
      {/* Added Umami tracking script */}
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="e684e1e1-21bd-4486-97fa-67777b352d0b"
      />
      {/* Apply font class and antialiased for better rendering */}
      <body className={`font-styrene antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
