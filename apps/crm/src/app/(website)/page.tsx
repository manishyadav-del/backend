'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HomePage from './category/page';
import BlogsPage from './blogs/page';
import Hero from '@/components/Hero';
import { usePageContent, useGlobalSettings, useGlobalBackend } from '@global/global-backend-next';

// Dynamically load SDK components that depend on next/script to avoid SSR failures
const DynamicRenderer = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.DynamicRenderer })),
  { ssr: false }
);
const SchemaScript = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.SchemaScript })),
  { ssr: false }
);
const AnalyticsScripts = dynamic(
  () => import('@global/global-backend-next').then(m => ({ default: m.AnalyticsScripts })),
  { ssr: false }
);

interface HeroSectionProps {
  content: {
    title?: string;
    subtitle?: string;
  };
  settings: {
    background?: string;
  };
}

interface FeatureGridProps {
  content: {
    features?: string[];
  };
}

// Custom components mapping matching [slug]/page.tsx
const customComponents = {
  HeroSection: ({ content, settings }: HeroSectionProps) => (
    <section className="py-20 px-8 text-center" style={{ backgroundColor: settings?.background || '#f3f4f6' }}>
      <h1 className="text-4xl font-bold text-gray-900">{content?.title}</h1>
      <p className="text-xl text-gray-600 mt-4">{content?.subtitle}</p>
    </section>
  ),
  FeatureGrid: ({ content }: FeatureGridProps) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 max-w-5xl mx-auto">
      {content?.features?.map((item: string, i: number) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow-md border text-center">
          {item}
        </div>
      ))}
    </div>
  ),
};

export default function MyApp() {
  const sdk = useGlobalBackend();
  const { page, loading } = usePageContent(sdk, '/');
  const { settings } = useGlobalSettings(sdk);

  const hasCmsSections = page?.sections_rel && Array.isArray(page.sections_rel) && page.sections_rel.length > 0;

  if (loading) {
    return <div className="p-12 text-center text-lg text-gray-500">Loading home...</div>;
  }

  return (
    <>
      {/* Auto-inject analytics trackers (GA, Microsoft Clarity, FB Pixel, etc.) */}
      {settings && <AnalyticsScripts settings={settings} />}
      {/* Render dynamic Schema LD+JSON scripts */}
      {page?.seo && <SchemaScript schema={page.seo.llmTxt} />}

      <main className="mb-0 mt-0">
        {hasCmsSections ? (
          <DynamicRenderer 
            sections={page?.sections_rel} 
            components={customComponents} 
          />
        ) : (
          <Suspense fallback={<div className="p-12 text-center text-lg text-gray-500">Loading components...</div>}>
            <Hero />
            <HomePage />
            <BlogsPage pagePath="/" />
          </Suspense>
        )}
      </main>
    </>
  );
}