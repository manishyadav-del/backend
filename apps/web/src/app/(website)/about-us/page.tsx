'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import { usePageContent, useGlobalSettings, useGlobalBackend } from '@global/global-backend-next';
import dynamic from 'next/dynamic';

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
import { globalBackendService } from '@/services/global-backend.service';

// Interface for a blog post
interface BlogPost {
  blog_id: number;
  blog_slug: string;
  blog_title: string;
  blog_description: string;
  blog_tag: string;
  blog_category_id: number;
  blog_feature_image: string;
  blog_content: string;
  blog_author: string;
  blog_date: string;
  formatted_blog_date?: string;
  status: string;
}

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

const AboutUsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  const sdk = useGlobalBackend();
  const { page, loading: loadingCms } = usePageContent(sdk, '/about-us');
  const { settings } = useGlobalSettings(sdk);

  // Fetch blogs from Global Backend with fallback to local API
  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoadingBlogs(true);
      setBlogsError(null);
      try {
        // Try global backend first with target page filter
        const globalBlogs = await globalBackendService.getAllBlogs('/about-us');

        if (globalBlogs.length > 0) {
          const formattedData = globalBlogs.slice(0, 3).map((blog) => ({
            blog_id: parseInt(blog.id) || 0,
            blog_slug: blog.slug,
            blog_title: blog.title,
            blog_description: blog.description,
            blog_tag: '',
            blog_category_id: parseInt(blog.categoryId) || 0,
            blog_feature_image: blog.featureImage,
            blog_content: blog.content,
            blog_author: blog.author,
            blog_date: blog.date,
            formatted_blog_date: new Date(blog.date).toLocaleDateString(
              'en-US',
              {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }
            ),
            status: blog.status,
          }));
          setBlogs(formattedData);
        } else {
          // Fallback to local API
          const response = await fetch('/api/blogs');
          if (!response.ok) {
            throw new Error('Failed to fetch blog posts.');
          }
          const data: BlogPost[] = await response.json();

          const formattedData = data.map((blog) => ({
            ...blog,
            formatted_blog_date: new Date(blog.blog_date).toLocaleDateString(
              'en-US',
              {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }
            ),
          }));

          setBlogs(formattedData);
        }
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
        setBlogsError('Failed to load blog posts. Please try again.');
      } finally {
        setIsLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, []);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about-us' },
  ];

  if (loadingCms) {
    return <div className="p-12 text-center text-lg text-gray-500">Loading about us...</div>;
  }

  const hasCmsSections = page?.sections_rel && Array.isArray(page.sections_rel) && page.sections_rel.length > 0;

  return (
    <>
      {/* Auto-inject analytics trackers (GA, Microsoft Clarity, FB Pixel, etc.) */}
      {settings && <AnalyticsScripts settings={settings} />}
      {/* Render dynamic Schema LD+JSON scripts */}
      {page?.seo && <SchemaScript schema={page.seo.llmTxt} />}

      <div className="min-h-screen py-21 px-4 sm:px-6 lg:px-8 font-sans antialiased">
        <div className="container mx-auto max-w-[1400px] flex flex-col gap-12">
          {hasCmsSections ? (
            <main className="flex-1 bg-white rounded-2xl p-8 md:p-12 lg:p-16">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
                  {page?.title || 'About Us'}
                </h1>
              </div>
              <DynamicRenderer
                sections={page?.sections_rel}
                components={customComponents}
              />
            </main>
          ) : (
            <main className="flex-1 bg-white rounded-2xl p-8 md:p-12 lg:p-16">
              <Breadcrumbs breadcrumbs={breadcrumbs} />

              <div className="mb-8 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight gradient-text">
                  About Us
                </h1>
                <div className="w-24 h-1 bg-[#4ccbc4] mx-auto rounded-full mt-4"></div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="md:w-1/2">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    About AHealthPlace
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-base sm:text-md">
                    Welcome to AHealthPlace, your go-to destination for health and
                    wellness information that empowers and inspires. At
                    AHealthPlace, we believe in the transformative power of
                    knowledge and the importance of fostering a community dedicated
                    to a healthier and happier lifestyle.
                  </p>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <Image
                    src="/featured-blog-The-Power-of-Telehealth-Revolutionizing-Access-to-Healthcare.jpg"
                    alt="Image of a healthcare professional on a video call"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg object-cover w-full h-full object-top"
                  />
                </div>
              </div>

              {/* Blogs Section */}
              <section className="mt-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                  Our Latest Blogs
                </h2>

                {isLoadingBlogs ? (
                  <div className="text-center text-gray-500">Loading blogs...</div>
                ) : blogsError ? (
                  <div className="text-center text-red-500">{blogsError}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.slice(0, 3).map((blog) => (
                      <div
                        key={blog.blog_id}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                      >
                        <Link href={`/blogs/${blog.blog_slug}`} className="block">
                          <Image
                            src={blog.blog_feature_image}
                            alt={blog.blog_title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover object-top"
                          />
                        </Link>
                        <div className="p-5 flex flex-col justify-between">
                          <div>
                            <Link
                              href={`/blogs/${blog.blog_slug}`}
                              className="block"
                            >
                              <h3 className="text-xl font-bold text-gray-900 leading-tight hover:text-[#4ccbc4] transition-colors">
                                {blog.blog_title}
                              </h3>
                            </Link>
                            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                              {blog.blog_description}
                            </p>
                          </div>
                          <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                👤 {blog.blog_author}
                              </span>
                              <span className="flex items-center">
                                📅 {blog.formatted_blog_date}
                              </span>
                            </div>
                            <Link
                              href={`/blogs/${blog.blog_slug}`}
                              className="inline-block px-3 py-2 text-sm font-semibold text-white bg-[#4ccbc4] rounded-md hover:bg-gray-700 transition-colors"
                            >
                              READ MORE
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          )}
        </div>
      </div>
    </>
  );
};

export default AboutUsPage;
