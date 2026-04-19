import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/context/AuthContext';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Battlenix Admin',
  description: 'Battlenix admin panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-screen flex-col"
        style={{
          fontFamily: inter.style.fontFamily,
          backgroundColor: '#0A0A0F',
          color: '#F1F5F9',
        }}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
