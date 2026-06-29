'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGlobalSettings, useNavigation, useGlobalBackend } from '@global/global-backend-next';
import { getImageUrl } from '@/utils/imageHelper';

export default function Header() {
  const sdk = useGlobalBackend();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { settings } = useGlobalSettings(sdk);
  const headerSettings = settings?.header as any;

  // Fetch navigation from backend; fall back to hardcoded links
  const { items: navItems } = useNavigation(sdk, 'header');

  const displayLinks = headerSettings?.navLinks && headerSettings.navLinks.length > 0
    ? headerSettings.navLinks.map((link: any) => ({ name: link.label.toUpperCase(), href: link.href }))
    : navItems && navItems.length > 0
      ? navItems.map((item: any) => ({ name: (item.label || item.title || item.name || '').toUpperCase(), href: item.path || item.href || item.url || '/' }))
      : [
          { name: 'HOME', href: '/' },
          { name: 'PUBLICATIONS', href: '/publication' },
          { name: 'ABOUT US', href: '/about-us' },
          { name: 'CONTACT', href: '/contact' },
        ];

  const logoSrc = getImageUrl(settings?.brand?.logo || headerSettings?.logo || '/Logo-web.png');
  const isSticky = headerSettings?.sticky ?? true;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blogs?title=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className={`${isSticky ? 'fixed' : 'absolute'} top-0 left-0 w-full z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm font-sans antialiased`}>
      {headerSettings?.announcementBarActive && headerSettings.announcementBarText && (
        <div className="bg-gradient-to-r from-teal-600 to-sky-600 text-white py-2 px-4 text-center text-xs font-bold tracking-wide uppercase w-full">
          {headerSettings.announcementBarText}
        </div>
      )}
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between max-w-[1400px]">

        {/* Mobile Header */}
        <div className="flex w-full items-center justify-between md:hidden">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <img
              src={logoSrc}
              alt="A Health Place Logo"
              className="w-auto h-10 object-contain"
            />
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-600 hover:text-teal-600 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex flex-1 items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
            <img
              src={logoSrc}
              alt="A Health Place Logo"
              className="w-auto h-12 object-contain"
            />
          </Link>

          <nav className="flex-1 px-12">
            <ul className="flex justify-center space-x-8">
              {displayLinks.map((link: any) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm font-bold tracking-wider text-slate-600 hover:text-[#0d9488] transition-colors duration-200 uppercase relative py-1.5 link-underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search & CTA */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-60">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="py-2 pl-4 pr-10 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white/60 backdrop-blur-sm transition-all shadow-inner text-sm w-full text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0d9488] transition-colors"
                aria-label="Search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {headerSettings?.ctaText && (
              <Link
                href={headerSettings.ctaLink || '/contact'}
                className="bg-teal-600 text-white px-5 py-2 rounded-full font-bold hover:bg-teal-700 transition-all text-xs tracking-wider uppercase shadow-md shadow-teal-600/10 whitespace-nowrap cursor-pointer"
              >
                {headerSettings.ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <nav className={`fixed inset-0 h-screen w-screen bg-slate-950/95 backdrop-blur-md shadow-2xl transform transition-all duration-500 ease-in-out z-[60] flex flex-col justify-center px-8 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
          aria-label="Close menu"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <ul className="flex flex-col space-y-8 text-center">
          {displayLinks.map((link: any) => (
            <li key={link.name}>
              <Link
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-bold tracking-widest text-slate-300 hover:text-[#0d9488] transition-colors uppercase"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
