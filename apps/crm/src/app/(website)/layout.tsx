'use client';

import React, { Suspense } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from 'next/dynamic';
import "../website-globals.css";

import 'react-toastify/dist/ReactToastify.css';
import Footer from "@/common/footer";
import CookieConsent from "@/components/CookieConsent";
import VisitorTracker from "@/components/VisitorTracker";
import Header from "@/common/header";
import { ReduxProvider } from "@/redux/provider";
import { globalBackendClient } from '@/lib/global-backend';
import { usePathname } from "next/navigation";

// Dynamically import GlobalBackendProvider with ssr:false to avoid
// next/script resolution failure during static generation
const GlobalBackendProvider = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.GlobalBackendProvider })),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/user-dashboard') || pathname.startsWith('/projects') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/home');

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ fontFamily: 'var(--font-sans)' }}>
      <GlobalBackendProvider client={globalBackendClient}>
        <ReduxProvider>
          {!isDashboardRoute && <Header />}
          <main className="min-h-screen pt-20">
            {children}
          </main>
          {!isDashboardRoute && <Footer />}
          <CookieConsent />
          <VisitorTracker />
        </ReduxProvider>
      </GlobalBackendProvider>
    </div>
  );
}
