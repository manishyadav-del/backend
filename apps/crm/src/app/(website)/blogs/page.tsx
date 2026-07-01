/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { globalBackendService } from '@/services/global-backend.service';
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

// Interface for a blog post
interface BlogPost {
  blog_id: string | number;
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

interface Category {
  name: string;
  image: string;
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

const BlogsPage = (props: any) => {
  const pagePath = props?.pagePath;


  const searchParams = useSearchParams();
  const searchTitle = searchParams ? (searchParams.get('title') || '') : '';

  const sdk = useGlobalBackend();
  const { page, loading: loadingCms } = usePageContent(sdk, 'blogs');
  const { settings } = useGlobalSettings(sdk);

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<Category[]>([]);
  const visibleCount = 6; // Fixed count for now, can be made dynamic later

  // Modal Editor state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    featuredImage: '',
    author: '',
  });

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.blog_title,
      slug: blog.blog_slug,
      content: blog.blog_content,
      excerpt: blog.blog_description || '',
      category: blog.category_name || '',
      featuredImage: blog.blog_feature_image || '',
      author: blog.blog_author || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const { globalBackendClient } = await import('@/lib/global-backend');
      await globalBackendClient.fetch(`/blogs/public/${id}`, { method: 'DELETE' });

      setBlogs(prev => prev.filter(b => b.blog_id !== id));
      alert('Blog deleted successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete blog post.');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    try {
      const { globalBackendClient } = await import('@/lib/global-backend');
      await globalBackendClient.fetch(`/blogs/public/${editingBlog.blog_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt,
          category: formData.category,
          featuredImage: formData.featuredImage,
          author: formData.author,
        }),
      });

      setBlogs(prev => prev.map(b => b.blog_id === editingBlog.blog_id ? {
        ...b,
        blog_title: formData.title,
        blog_slug: formData.slug,
        blog_content: formData.content,
        blog_description: formData.excerpt,
        category_name: formData.category,
        blog_feature_image: formData.featuredImage,
        blog_author: formData.author,
      } : b));

      setShowEditModal(false);
      setEditingBlog(null);
      alert('Blog updated successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update blog post.');
    }
  };



  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Always fetch from global backend — it is the single source of truth
      const globalBlogs = await globalBackendService.getAllBlogs() || [];
      if (globalBlogs.length === 0) {
        setError('No blog posts found on the backend CMS.');
      }
      const formattedData = globalBlogs.map((blog) => {
        const dateVal = blog.publishedAt || blog.createdAt;
        const parsedDate = dateVal ? new Date(dateVal) : new Date();
        const formattedDate = isNaN(parsedDate.getTime())
          ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : parsedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        return {
          blog_id: blog.id,
          blog_slug: blog.slug,
          blog_title: blog.title,
          blog_description: blog.excerpt || '',
          blog_tag: '',
          blog_category_id: 0,
          blog_feature_image: blog.featuredImage || '',
          blog_content: blog.content || '',
          blog_author: blog.author || 'Admin',
          blog_date: blog.publishedAt || blog.createdAt || '',
          formatted_blog_date: formattedDate,
          status: blog.status,
          category_name: blog.category || 'General',
        };
      });
      setBlogs(formattedData);
    } catch (err: any) {
      // On timeout or network error, keep existing blogs visible (don't wipe them on refresh)
      const isTimeout = err?.message?.includes('timed out');
      if (isTimeout) {
        console.warn('[Blogs] Backend request timed out — keeping existing data. Will retry on next refresh.');
        // Only set error on initial load (no existing blogs), not on background refresh
        if (blogs.length === 0) {
          setError('Backend is slow to respond. Please wait or refresh the page.');
        }
      } else {
        console.error('Failed to fetch blog posts from global backend:', err);
        setError(err.message || 'Failed to fetch blogs from global backend');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Auto-refresh every 30 seconds so backend changes (add/edit/delete) appear automatically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBlogs();
    }, 30000);
    return () => clearInterval(interval);
  }, []);



  // Build categories with feature images from first blog matching category (based on blog_tag)
  useEffect(() => {
    if (blogs.length > 0) {
      // Extract unique category names from blogs
      const uniqueCategoryNames = Array.from(
        new Set(blogs.map(blog => blog.category_name))
      );

      // Filter out undefined category names before mapping
      const categoriesWithImages: Category[] = uniqueCategoryNames
        .filter((name): name is string => typeof name === 'string')
        .map(categoryName => {
          const blogWithImage = blogs.find(blog => blog.category_name === categoryName);
          return {
            name: categoryName,
            image: blogWithImage?.blog_feature_image || '',
          };
        });

      // Prepend 'All' category
      setCategories([{ name: 'All', image: '' }, ...categoriesWithImages]);
    }
  }, [blogs]);

  useEffect(() => {
    let updatedBlogs = blogs;

    if (selectedCategory !== 'All') {
      updatedBlogs = updatedBlogs.filter(blog => blog.category_name === selectedCategory);
    }

    if (searchTitle) {
      updatedBlogs = updatedBlogs.filter(blog =>
        blog.blog_title.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    setFilteredBlogs(updatedBlogs);
  }, [blogs, selectedCategory, searchTitle]);

  // const breadcrumbs = [
  //   { name: 'Home', href: '/' },
  //   { name: 'Blogs', href: '/blogs' },
  // ];

  const hasCmsSections = page?.sections_rel && Array.isArray(page.sections_rel) && page.sections_rel.length > 0;

  if (loadingCms) {
    return <div className="p-12 text-center text-lg text-gray-500">Loading blog content...</div>;
  }

  if (hasCmsSections) {
    return (
      <>
        {settings && <AnalyticsScripts settings={settings} />}
        {page?.seo && <SchemaScript schema={page.seo.llmTxt} />}
        <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 font-sans antialiased">
          <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-12">
            <main className="flex-grow bg-white rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16">
              <DynamicRenderer
                sections={page?.sections_rel}
                components={customComponents}
              />
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-12">
        <main className="flex-1 bg-white rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16">

          {/* Category Filter Section */}
          {/* <div className="h-[50vh] mb-8 max-w-6xl mx-auto px-4 flex flex-col justify-center"> */}
          {/* 🔼 Bigger Heading */}
          {/* <div className="justify-center text-center mb-10 font-bold">
              <p className="text-2xl sm:text-3xl text-gray-700">Explore within...</p>
            </div> */}

          {/* 🔼 Bigger Buttons with More Padding */}
          {/* <div className="flex flex-wrap gap-6 justify-center">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center bg-[#edf2f7] text-base text-[#2d3748] rounded-2xl px-5 py-5 shadow-md hover:shadow-lg transition-all duration-200
        ${selectedCategory === category.name ? 'ring-2 ring-[#4ccbc4] bg-white' : ''}`}
                >
                  {category.image ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                      <Image
                        src={category.image}
                        alt={category.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center text-gray-600 text-sm font-semibold">
                      N/A
                    </div>
                  )}
                  <span className="whitespace-normal text-lg font-semibold leading-snug text-left">
                    {category.name}
                  </span>
                </button>
              ))}
            </div> */}
          {/* </div> */}


          {/* Blogs Section */}
          <div className="mb-16 flex flex-col items-center justify-center text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">Our <span className="gradient-text">Publications</span></h1>
            <p className="mt-4 text-slate-600 text-lg max-w-2xl font-medium">
              Explore our latest articles, guides, and insights on health, wellness, and medical insurance.
            </p>
            <div className="w-16 h-1.5 bg-gradient-to-r from-teal-500 to-sky-500 mx-auto rounded-full mt-6"></div>
            <button
              onClick={fetchBlogs}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/10 cursor-pointer"
              title="Refresh blogs from backend"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              REFRESH
            </button>

            {/* Diagnostic Console Panel */}
            <div className="mt-8 p-6 glass-card rounded-2xl text-sm font-sans text-left max-w-xl w-full mx-auto shadow-md border-teal-100/50 space-y-3">
              <div className="font-bold border-b border-slate-100 pb-2 mb-2 text-teal-800 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                🔍 SDK Diagnostics Monitor
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                <div>Status: <span className="text-teal-600 font-bold">{isLoading ? 'Loading...' : 'Healthy'}</span></div>
                <div>Error: <span className="font-bold text-slate-500">{error || 'None'}</span></div>
                <div>Blogs (Raw): <span className="text-slate-800 font-bold">{blogs.length}</span></div>
                <div>Blogs (Filtered): <span className="text-slate-800 font-bold">{filteredBlogs.length}</span></div>
              </div>
            </div>
          </div>

          <section className="mb-12">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="w-full h-52 bg-slate-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-8 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 px-6 bg-red-50 border border-red-100 rounded-2xl text-red-700 max-w-2xl mx-auto">
                <p className="font-bold text-lg">{error}</p>
                <p className="text-sm mt-2 text-red-500">Please verify the database connection configuration details or backend state.</p>
                <button
                  onClick={fetchBlogs}
                  className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-bold text-xs tracking-wider cursor-pointer"
                >
                  TRY AGAIN
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredBlogs.slice(0, visibleCount).map((blog) => (
                    <div
                      key={blog.blog_id}
                      className="glass-card rounded-2xl overflow-hidden shadow-lg flex flex-col h-full group"
                    >
                      {/* Image Section */}
                      <Link href={`/blogs/${blog.blog_slug}`} className="block overflow-hidden relative h-52">
                        <img
                          src={blog.blog_feature_image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'}
                          alt={blog.blog_title}
                          className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="absolute top-4 left-4 bg-teal-600/90 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm">
                          {blog.category_name}
                        </div>
                      </Link>

                      {/* Content Section */}
                      <div className="p-6 flex flex-col justify-between flex-grow">
                        <div>
                          {/* Title */}
                          <Link href={`/blogs/${blog.blog_slug}`} className="block mb-3">
                            <h3 className="text-xl font-bold text-slate-900 leading-snug hover:text-teal-600 transition-colors line-clamp-2">
                              {blog.blog_title}
                            </h3>
                          </Link>

                          {/* Blog Content */}
                          <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                            {stripHtml(blog.blog_content).slice(0, 150)}...
                          </p>
                        </div>

                        {/* Meta info + Read more */}
                        <div className="mt-auto pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center space-x-3.5">
                            <span className="flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1 text-teal-500/70" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {blog.blog_author}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1 text-teal-500/70" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                  fill="currentColor"
                                  d="M12 8a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 0111 13V9a1 1 0 011-1zm0-6C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                                />
                              </svg>
                              {blog.formatted_blog_date}
                            </span>
                          </div>

                          {/* Read More Link */}
                          <Link
                            href={`/blogs/${blog.blog_slug}`}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline tracking-wider uppercase transition-colors"
                          >
                            Read More →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < filteredBlogs.length && (
                  <div className="flex justify-center mt-8">
                    <Link href="blogs">
                      <button
                        className="px-6 py-2 bg-[#4ccbc4] text-white rounded-full hover:bg-blue-500 transition duration-300"
                      >
                        Load More
                      </button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          {/* recent post */}
          {selectedCategory === 'All' && (
            <section className="mt-12 max-w-[1400px] mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Recent posts</h2>
              <p className="text-sm font-medium text-gray-900 mb-6">Don&apos;t miss the latest trends</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent + Latest posts: left 2 columns */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.map((blog) => (
                    <div key={blog.blog_id} className="bg-gray-100 rounded p-4 flex flex-col h-full">
                      {/* Blog Content */}
                      <h3 className="font-semibold text-gray-600 mb-4 line-clamp-3 flex-grow">
                        {stripHtml(blog.blog_content)}
                      </h3>

                      {/* Footer: author info, date, and read more */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-3">
                          <img
                            src={blog.blog_feature_image || "/default-avatar.png"}
                            alt={blog.blog_author}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                            <span>
                              {blog.blog_date
                                ? new Date(blog.blog_date).getDate()
                                : "-"}
                            </span>
                            <span>
                              {new Date(blog.blog_date).toLocaleString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/blogs/${blog.blog_slug}`}
                          className="text-sm text-gray-400 hover:text-[#4ccbc4]">
                          Read more
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Popular Posts Sidebar */}
                <aside className="bg-gray-100 p-6 rounded">
                  <h3 className="text-gray-900 font-semibold text-xl border-b-2 border-[#4ccbc4] pb-2 mb-4">
                    Popular Posts
                  </h3>
                  <ul className="space-y-6">
                    {blogs.slice(0, 4).map((blog) => (
                      <li key={blog.blog_id} className="flex items-start space-x-4">
                        <img
                          src={blog.blog_feature_image}
                          alt={blog.blog_title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <h4 className="text-gray-700 font-semibold line-clamp-2">{blog.blog_title}</h4>
                          <time className="text-gray-400 text-sm mt-1 block">
                            {new Date(blog.blog_date).toLocaleDateString()}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Website Inline Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Blog Post (Website Inline Editor)</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded p-2 text-sm text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border rounded p-2 text-sm text-gray-900"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded p-2 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full border rounded p-2 text-sm text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Excerpt / Description</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full border rounded p-2 text-sm text-gray-900"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border rounded p-2 text-sm font-mono text-gray-900"
                  rows={8}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Feature Image URL</label>
                <input
                  type="text"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  className="w-full border rounded p-2 text-sm text-gray-900"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-50 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4ccbc4] text-white rounded text-sm hover:bg-[#3bb3ab] font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function BlogsPageWrapper(props: any) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading blogs...</div>}>
      <BlogsPage {...props} />
    </Suspense>
  );
}

export default BlogsPageWrapper;
