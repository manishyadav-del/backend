'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube, Twitter, Github } from 'lucide-react';
import { useGlobalSettings, useNavigation, useGlobalBackend } from '@global/global-backend-next';
import { getImageUrl } from '@/utils/imageHelper';

const Footer: React.FC = () => {
  const sdk = useGlobalBackend();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const { settings } = useGlobalSettings(sdk);
  const footerSettings = settings?.footer as any;

  // Fetch footer navigation from backend
  const { items: footerNavItems } = useNavigation(sdk, 'footer');

  const displaySocialLinks = footerSettings?.socialLinks && footerSettings.socialLinks.length > 0
    ? footerSettings.socialLinks
    : [
        { platform: 'facebook', url: 'https://www.facebook.com/ahealthplace' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/company/a-health-place/' },
        { platform: 'instagram', url: 'https://www.instagram.com/ahealthplace/' },
        { platform: 'youtube', url: 'https://www.youtube.com/@ahealthplace' }
      ];

  const getSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === 'facebook') return <Facebook size={20} className="text-white group-hover:text-white transition duration-300" />;
    if (p === 'linkedin') return <Linkedin size={20} className="text-white group-hover:text-white transition duration-300" />;
    if (p === 'instagram') return <Instagram size={20} className="text-white group-hover:text-white transition duration-300" />;
    if (p === 'youtube') return <Youtube size={20} className="text-white group-hover:text-white transition duration-300" />;
    if (p === 'twitter' || p === 'x') return <Twitter size={20} className="text-white group-hover:text-white transition duration-300" />;
    if (p === 'github') return <Github size={20} className="text-white group-hover:text-white transition duration-300" />;
    return null;
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('❌ Please enter a valid email.');
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('✅ Thank you for subscribing!');
        setEmail('');
      } else {
        setStatus(`⚠️ ${data.message || 'Something went wrong.'}`);
      }

      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('❌ Network error. Please try again later.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const copyrightText = footerSettings?.copyright || `© ${new Date().getFullYear()} A HEALTH PLACE - Managed by DO IT FOR ME LLC. All Rights Reserved.`;

  return (
    <footer id="footer" className="bg-slate-950 text-slate-400 border-t border-slate-900 py-16 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 px-6 sm:px-10 lg:px-14 py-8">

          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-4">
            <div className="flex items-center space-x-2 mb-4">
              <Link href="/">
                <Image src={getImageUrl(footerSettings?.logo || "/Logo-Main.png")} alt="A Health Place Logo" width={500} height={500} className="w-auto h-auto max-h-[50px]" />
              </Link>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              {footerSettings?.description || "A Health Place is a free to use service for all your health information needs. Covering all aspects of health information, treatments, coverages, and comparisons."}
            </p>
            {/* Social Media */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-teal-400 uppercase tracking-wider">Follow us</h3>
              <div className="flex flex-wrap gap-2">
                {displaySocialLinks.map((item: any, idx: number) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.platform}
                    className="bg-slate-900 p-2 rounded duration-300 hover:bg-teal-600 group flex items-center justify-center border border-slate-800"
                  >
                    {getSocialIcon(item.platform)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Columns (if any) */}
          {footerSettings?.columns && footerSettings.columns.length > 0 ? (
            <div className="col-span-1 md:col-span-5 grid grid-cols-2 gap-6">
              {footerSettings.columns.map((col: any, idx: number) => (
                <div key={idx}>
                  <h3 className="text-base font-bold mb-4 text-[#4ccbc4] uppercase tracking-wide">{col.title}</h3>
                  <ul className="space-y-3">
                    {col.links?.map((link: any, lIdx: number) => (
                      <li key={lIdx}>
                        <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition duration-200">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-1 md:col-span-5 flex flex-col justify-between h-full">
              {/* Barcode */}
              <div className="flex items-center mt-2">
                <a href={footerSettings?.barcodeLink || "https://portal.issn.org/resource/ISSN/3066-5000"} className="block">
                  <Image src={getImageUrl(footerSettings?.barcodeImage || "/AHP-Web.jpg")}
                    alt="ISSN Barcode"
                    width={300}
                    height={150}
                    className="object-contain w-[240px] h-auto"
                  />
                </a>
              </div>
            </div>
          )}

          {/* Newsletter / Contact column */}
          <div className="col-span-1 md:col-span-3">
            <ul className="flex flex-col gap-2 text-gray-400">
              <h3 className="text-base font-bold text-white uppercase tracking-wide mb-2">
                {footerSettings?.contactTitle || "Contact"}
              </h3>
              <li className="mt-1 mb-2">
                <p className="text-sm">Send us an email:</p>
                <a href={`mailto:${footerSettings?.contactEmail || "ahealthplace@gmail.com"}`} className="text-sm text-slate-400 hover:text-teal-400 transition">
                  <span>{footerSettings?.contactEmail || "ahealthplace@gmail.com"}</span>
                </a>
              </li>
            </ul>

            {(footerSettings?.showNewsletter ?? true) && (
              <form onSubmit={handleSubscribe} className="w-full mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder-slate-500 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-white text-xs font-semibold bg-teal-600 rounded-lg hover:bg-teal-700 transition duration-300 whitespace-nowrap shadow-md shadow-teal-600/10 cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>
                {status && (
                  <p className="text-xs mt-2" style={{ color: status.startsWith('✅') ? '#14b8a6' : '#f87171' }}>
                    {status}
                  </p>
                )}
              </form>
            )}

            {footerSettings?.columns && footerSettings.columns.length > 0 && (
              <div className="flex items-center mt-6">
                <a href={footerSettings?.barcodeLink || "https://portal.issn.org/resource/ISSN/3066-5000"} className="block">
                  <Image src={getImageUrl(footerSettings?.barcodeImage || "/AHP-Web.jpg")}
                    alt="ISSN Barcode"
                    width={300}
                    height={150}
                    className="object-contain w-[200px] h-auto"
                  />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-6 pt-6 text-sm flex flex-col lg:flex-row-reverse justify-between items-center text-gray-400">
          {/* Links — from backend navigation or hardcoded fallback */}
          <div className="mb-4 lg:mb-0 flex gap-6">
            {footerNavItems && footerNavItems.length > 0
              ? footerNavItems.map((item: any, idx: number) => (
                  <Link key={idx} href={item.path || item.href || item.url || '/'} className="hover:text-white transition">
                    {item.label || item.title || item.name}
                  </Link>
                ))
              : (
                <>
                  <Link href="/about-us" className="hover:text-white transition">About</Link>
                  <Link href="/privacy-policy" className="hover:text-white transition">Privacy &amp; Policy</Link>
                  <Link href="/terms-and-conditions" className="hover:text-white transition">Terms &amp; Condition</Link>
                  <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
                </>
              )
            }
          </div>

          {/* Copyright */}
          <p className="text-center lg:text-left text-xs">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
