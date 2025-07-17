import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SBC App Kit - Next.js Backend Example',
  description: 'Secure backend integration pattern for SBC App Kit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
} 