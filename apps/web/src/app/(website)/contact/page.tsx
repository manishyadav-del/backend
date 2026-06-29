"use client";

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
  category_name?: string;
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

// Define custom components mapping for Contact dynamic template
const customComponents = {
  HeroSection: ({ content, settings }: HeroSectionProps) => (
    <section className="py-12 px-6 text-center rounded-xl mb-8" style={{ backgroundColor: settings?.background || '#f9fafb' }}>
      <h1 className="text-3xl font-extrabold text-gray-900">{content?.title}</h1>
      <p className="text-lg text-gray-600 mt-2">{content?.subtitle}</p>
    </section>
  ),
  FeatureGrid: ({ content }: FeatureGridProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {content?.features?.map((item: string, i: number) => (
        <div key={i} className="p-4 bg-white rounded-lg border shadow-sm">
          {item}
        </div>
      ))}
    </div>
  ),
};

// Reusable component for the social media icons
const SocialIcons = () => (
  <div className="flex space-x-3">
    <a href="https://www.facebook.com/ahealthplace/" aria-label="Facebook" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors transform hover:scale-110 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 5.109 3.73 9.351 8.583 9.941V14.18H7.31v-2.18h3.273V9.73c0-3.238 1.977-5.006 4.87-5.006 1.385 0 2.57.103 2.91.148v3.352h-1.99c-1.57 0-1.876.748-1.876 1.84v2.446h3.754l-.6 3.12h-3.154V21.941c4.853-.59 8.583-4.832 8.583-9.941 0-5.523-4.477-10-10-10z" />
      </svg>
    </a>
    <a href="https://www.instagram.com/ahealthplace/" aria-label="Instagram" className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 transition-colors transform hover:scale-110 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.585.016 4.85.07c3.251.148 4.793 1.69 4.939 4.94.054 1.264.07 1.646.07 4.85s-.016 3.585-.07 4.85c-.148 3.251-1.69 4.793-4.94 4.939-1.265.054-1.646.07-4.85.07s-3.585-.016-4.85-.07c-3.251-.148-4.793-1.69-4.939-4.94-.054-1.265-.07-1.646-.07-4.85s.016-3.585.07-4.85c.148-3.251 1.69-4.793 4.94-4.939 1.265-.054 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.201-6.78 2.623-6.981 6.981-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.201 4.358 2.623 6.78 6.981 6.981 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c4.358-.201 6.78-2.623 6.981-6.981.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.201-4.358-2.623-6.78-6.981-6.981-1.28-.058-1.688-.072-4.947-.072zm0 5.867a6.133 6.133 0 100 12.267 6.133 6.133 0 000-12.267zm0 10.133a4 4 0 110-8 4 4 0 010 8zm6.54-10.92a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
      </svg>
    </a>
    <a href="https://www.linkedin.com/company/a-health-place" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white hover:bg-blue-900 transition-colors transform hover:scale-110 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.769s.784-1.769 1.75-1.769c.966 0 1.75.79 1.75 1.769s-.783 1.769-1.75 1.769zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    </a>
    <a href="https://www.youtube.com/@ahealthplace/shorts" aria-label="YouTube" className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors transform hover:scale-110 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-1.121-.081-2.19-.153-3.21-.194-1.229-.053-2.483-.081-3.775-.081s-2.546.028-3.775.081c-1.02.041-2.089.113-3.21.194-2.553.183-4.52 1.942-4.664 4.495-.08 1.439-.125 2.946-.125 4.498s.045 3.059.125 4.498c.144 2.553 2.111 4.312 4.664 4.495 1.121.081 2.19.153 3.21.194 1.229.053 2.483.081 3.775.081s2.546-.028 3.775-.081c1.02-.041 2.089-.113 3.21-.194 2.553-.183 4.52-1.942 4.664-4.495.08-1.439.125-2.946.125-4.498s-.045-3.059-.125-4.498c-.144-2.553-2.111-4.312-4.664-4.495zM9 16.32v-8.64l6.236 4.32-6.236 4.32z" />
      </svg>
    </a>
  </div>
);

const ContactUsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [status, setStatus] = useState<string | null>(null);
  const [magazines, setMagazines] = useState<BlogPost[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  const sdk = useGlobalBackend();
  const { page, loading: loadingCms } = usePageContent(sdk, '/contact');
  const { settings } = useGlobalSettings(sdk);

  // useEffect hook to fetch data from the backend
  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        const globalBlogs = await globalBackendService.getAllBlogs();
        if (globalBlogs.length > 0) {
          const mappedBlogs: BlogPost[] = globalBlogs.map(blog => ({
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
            status: blog.status,
            category_name: blog.categoryName || 'General',
          }));
          setMagazines(mappedBlogs);
        } else {
          const res = await fetch('/api/blogs');
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();

          if (!Array.isArray(data)) {
            throw new Error('Unexpected data format');
          }

          setMagazines(data);
        }
      } catch (err) {
        console.error('Failed to fetch magazines:', err);
        setBlogsError('Failed to load recent posts.');
      } finally {
        setIsLoadingBlogs(false);
      }
    };

    fetchMagazines();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('Your message has been sent!');
        setFormData({ name: '', email: '', phone: '', message: '' });

        setTimeout(() => {
          setStatus('');
        }, 3000);
      } else {
        setStatus(`Error: ${result.error || 'Something went wrong'}`);

        setTimeout(() => {
          setStatus('');
        }, 3000);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setStatus('Something went wrong. Please try again later.');
    }
  };

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Contact Us', href: '/contact' },
  ];

  if (loadingCms) {
    return <div className="p-12 text-center text-lg text-gray-500">Loading contact...</div>;
  }

  const hasCmsSections = page?.sections_rel && Array.isArray(page.sections_rel) && page.sections_rel.length > 0;

  return (
    <>
      {/* Auto-inject analytics trackers (GA, Microsoft Clarity, FB Pixel, etc.) */}
      {settings && <AnalyticsScripts settings={settings} />}
      {/* Render dynamic Schema LD+JSON scripts */}
      {page?.seo && <SchemaScript schema={page.seo.llmTxt} />}

      <div className="min-h-screen py-23 px-4 sm:px-6 lg:px-8 font-sans antialiased">
        <div className="container mx-auto max-w-[1400px]">
          {hasCmsSections ? (
            <main className="flex-1 bg-white p-8 md:p-12 lg:p-16">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
                <div className="mb-8 text-center">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight gradient-text">
                    Contact Us
                  </h1>
                  <div className="w-24 h-1 bg-[#4ccbc4] mx-auto rounded-full mt-4"></div>
                </div>
              <DynamicRenderer 
                sections={page?.sections_rel} 
                components={customComponents} 
              />
            </main>
          ) : (
            <div className="flex flex-col lg:flex-row gap-3">
              <main className="flex-1 bg-white p-8 md:p-12 lg:p-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="mb-8">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-[#4ccbc4] leading-tight">Contact Us</h1>
                </div>

                <p className="text-gray-600 leading-relaxed text-base sm:text-md mb-6">
                  We want to hear from you! If you have any questions or feedback, just use the form below. Your thoughts matter to us, so please get in touch!
                </p>
                <div className="text-gray-600 mb-8">
                  {(() => {
                    const emailContact = settings?.contacts?.find((c: any) => c.type?.toLowerCase() === 'email' || c.label?.toLowerCase() === 'email')?.value || 'info@ahealthplace.com';
                    const phoneContact = settings?.contacts?.find((c: any) => c.type?.toLowerCase() === 'phone' || c.label?.toLowerCase() === 'phone')?.value || '+1-786-371-2232';
                    const addressContact = settings?.contacts?.find((c: any) => c.type?.toLowerCase() === 'address' || c.label?.toLowerCase() === 'address')?.value;

                    return (
                      <>
                        <p className="mb-2">
                          <strong className="font-semibold text-gray-900 text-lg">Email:</strong> 
                          <a href={`mailto:${emailContact}`} className="text-[#4ccbc4] hover:text-gray-600 hover:underline transition-colors ml-1">{emailContact}</a>
                        </p>
                        <p className={addressContact ? "mb-2" : ""}>
                          <strong className="font-semibold text-gray-900 text-lg">Phone:</strong> 
                          <a href={`tel:${phoneContact.replace(/[^\d+]/g, '')}`} className="text-[#4ccbc4] hover:text-gray-600 transition-colors ml-1">{phoneContact}</a>
                        </p>
                        {addressContact && (
                          <p>
                            <strong className="font-semibold text-gray-900 text-lg">Address:</strong> 
                            <span className="text-gray-600 ml-1">{addressContact}</span>
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label htmlFor="name" className="block text-gray-800 font-semibold mb-2">Your name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-800 font-semibold mb-2">Your email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-8">
                    <label htmlFor="message" className="block text-gray-800 font-semibold mb-2">Your message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300"
                      required
                    ></textarea>
                  </div>
                  {status && <p className="text-lg text-green-400 mt-2 content-center">{status}</p>}

                  <div className="text-center mt-2">
                    <button
                      type="submit"
                      className="w-full max-w-sm px-8 py-4 bg-gradient-to-r from-[#4ccbc4] to-[#4ccbc4] text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      SUBMIT
                    </button>
                  </div>
                </form>

                <div className="mt-12 text-sm text-gray-500 text-center">
                  <p>
                    Published By : DO IT FOR ME LLC : 30 N Gould St, #24999, Sheridan, WY 82801
                  </p>
                </div>
              </main>

              <aside className="w-full lg:w-110 bg-white rounded-2xl p-8 md:p-12 lg:p-16 mt-8 lg:mt-0">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Follow us</h2>
                  <SocialIcons />
                </div>

                <hr className="my-8 border-gray-200" />

                <div className="">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Posts</h2>
                  {isLoadingBlogs ? (
                    <p className="text-gray-500">Loading recent posts...</p>
                  ) : blogsError ? (
                    <p className="text-red-500">{blogsError}</p>
                  ) : (
                    <section className="space-y-4 font-bold">
                      {magazines.slice(0, 4).map((post) => (
                        <div key={post.blog_id}>
                          <Link
                            href={`/blogs/${post.blog_slug}`}
                            className="flex items-start space-x-3 group"
                          >
                            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src={post.blog_feature_image}
                                alt={post.blog_title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>

                            <div className="flex flex-col justify-center">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#4ccbc4] transition-colors mb-1 line-clamp-2">
                                {post.blog_title}
                              </h3>

                              <div className="flex items-center text-xs text-gray-500">
                                <svg
                                  className="w-3 h-3 mr-1 text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                >
                                  <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm12-212V142c0-6.6-5.4-12-12-12h-8c-6.6 0-12 5.4-12 12v112c0 3.2 1.3 6.2 3.5 8.5l76 76c4.7 4.7 12.3 4.7 17 0l5.7-5.7c4.7-4.7 4.7-12.3 0-17L268 244z" />
                                </svg>
                                {new Date(post.blog_date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translate(-50%, 20px); }
          10%, 90% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeInOut {
          animation: fadeInOut 5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default ContactUsPage;
