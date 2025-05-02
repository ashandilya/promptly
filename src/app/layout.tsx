import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import Script from 'next/script'; // Import the Script component
// Removed Head import

export const metadata: Metadata = {
  title: 'Promptly Marketing', // Updated title
  description: 'A library of B2B marketing prompts.',
  // Font preloading links are removed as they are better handled by modern browser/bundler strategies or direct CSS.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Added suppressHydrationWarning to mitigate hydration errors
    <html lang="en" suppressHydrationWarning>
      {/* Head component removed */}
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
