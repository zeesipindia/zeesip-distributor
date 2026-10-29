import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zee Sip Distributor Portal',
  description: 'Official distributor and operations portal for Zee Sip',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
