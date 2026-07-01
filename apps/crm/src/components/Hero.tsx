'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
// 1. Data Structure based on your database fields
interface Blog {
    blog_slug: string;
    blog_title: string;
    blog_feature_image: string;
    blog_date: string; // The formatted date (DD/MM/YYYY)
    blog_category_id: string; // Used to fetch category name if needed, but we'll use a placeholder for category_name below.
    category_name: string; // IMPORTANT: Your API /api/blogs must join the category table to return this.
}

interface HeroBlogApiResponse {
    blog_id: number;
    blog_slug: string;
    blog_title: string;
    blog_description: string;
    blog_feature_image: string;
    blog_author: string;
    blog_category_id: number;
    category_name: string;
    blog_date: string;
}


import { globalBackendService } from '@/services/global-backend.service';
import { useComponentData, useGlobalBackend } from '@global/global-backend-next';

const BlogHeroSection = () => {
    const sdk = useGlobalBackend();
    const { data: backendConfig } = useComponentData(sdk, 'BlogHeroSection', {
        title: 'Featured Posts'
    });
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. Data Fetching - Using Global Backend Service
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                // Try to fetch from global backend first
                const featuredBlogs = await globalBackendService.getFeaturedBlogs(4);
                
                if (featuredBlogs.length > 0) {
                    const fetchedBlogs: Blog[] = featuredBlogs.map((blog) => ({
                        blog_slug: blog.slug,
                        blog_title: blog.title,
                        blog_feature_image: blog.featureImage || '/technology.jpg',
                        category_name: blog.categoryName || 'Uncategorized',
                        blog_date: blog.date || 'N/A',
                        blog_category_id: blog.categoryId,
                    }));
                    setBlogs(fetchedBlogs);
                } else {
                    // Fallback to local API if global backend has no data
                    const res = await fetch('/api/hero-blogs');
                    const data = await res.json().catch(() => null);

                    const blogRows = Array.isArray(data)
                        ? data
                        : Array.isArray(data?.blogs)
                            ? data.blogs
                            : [];

                    if (res.ok) {
                        const fetchedBlogs: Blog[] = blogRows.map((blog: HeroBlogApiResponse) => ({
                            blog_slug: blog.blog_slug,
                            blog_title: blog.blog_title,
                            blog_feature_image: blog.blog_feature_image || '/technology.jpg',
                            category_name: blog.category_name || 'Uncategorized',
                            blog_date: blog.blog_date || 'N/A',
                            blog_category_id: blog.blog_category_id.toString(),
                        }));
                        setBlogs(fetchedBlogs);
                    } else {
                        console.error('Hero API failed:', res.status, data);
                        if (data?.error) {
                            toast.error(`Failed to fetch blogs: ${data.error}`);
                        } else {
                            toast.error("Failed to fetch recent blogs.");
                        }
                        setBlogs([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch blog hero data:", error);
                toast.error("Network error fetching blogs.");
                setBlogs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Show message if no blogs available
    if (blogs.length === 0) {
        return (
            <section className="max-w-7xl mx-auto py-20">
                <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Featured Posts</h2>
                <div className="text-center py-10">
                    <p className="text-gray-600 dark:text-gray-400">No featured posts available at the moment.</p>
                </div>
            </section>
        );
    }


    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 gradient-text">
                    {backendConfig?.title || 'Featured Posts'}
                </h2>
                <div className="w-24 h-1.5 bg-gradient-to-r from-teal-500 to-sky-500 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {blogs.map((blog, index) => (
                    <Link
                        key={blog.blog_slug || index}
                        href={`/blogs/${blog.blog_slug}`}
                        className="group relative block h-[420px] overflow-hidden rounded-2xl border border-slate-100 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-2"
                    >
                        {/* Image Background */}
                        <div className="relative w-full h-full overflow-hidden">
                            <img
                                src={blog.blog_feature_image || '/technology.jpg'}
                                alt={blog.blog_title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.src = '/technology.jpg';
                                }}
                            />
                        </div>

                        {/* Dark Overlay for Contrast (covers image) */}
                        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/30 transition-all duration-300"></div>

                        {/* Gradient/Dark Content Area (Bottom) */}
                        <div className="absolute bottom-0 w-full p-6 text-white bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
                            <div className="space-y-3">
                                {/* Category Tag */}
                                <span className="inline-block bg-teal-600/90 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-md backdrop-blur-md shadow-sm">
                                    {blog.category_name}
                                </span>

                                {/* Title */}
                                <h3 className="text-xl font-bold leading-snug line-clamp-3 group-hover:text-teal-200 transition-colors">
                                    {blog.blog_title}
                                </h3>

                                {/* Date with Clock Icon */}
                                <p className="text-xs text-slate-300 flex items-center pt-1 font-medium">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                                    <span>{blog.blog_date}</span>
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} />
        </section>
    );
}

export default BlogHeroSection;
