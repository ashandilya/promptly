import type { Metadata } from 'next';
// Removed Geist font imports
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

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
    <html lang="en">
      {/* Removed Geist font variables from body className */}
      <body className={`antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
