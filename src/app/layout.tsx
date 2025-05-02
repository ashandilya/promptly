import type { Metadata } from 'next';
// Removed Geist font imports
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import Script from 'next/script'; // Import the Script component

// Removed Geist font instantiation

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
    // Added suppressHydrationWarning to mitigate hydration errors potentially caused by browser extensions
    <html lang="en" suppressHydrationWarning>
      {/* Added Umami tracking script */}
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="e684e1e1-21bd-4486-97fa-67777b352d0b"
      />
      {/* Removed Geist font variables from body className */}
      <body className={`antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
