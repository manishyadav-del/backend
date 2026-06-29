/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { globalBackendService } from '@/services/global-backend.service';

interface Blog {
    blog_id: string | number;
    blog_title: string;
    blog_content: string;
    blog_description: string;
    blog_feature_image: string;
    blog_slug: string;
    blog_date: string;
    status: 'active' | 'deleted';
    category_name: string;
    comments_count: number;
}

// ✅ Helper function to calculate reading time
function calculateReadingTime(htmlContent: string): number {
    const text = htmlContent.replace(/<[^>]*>/g, '');
    const wordCount = text.trim().split(/\s+/).length;
    const wordsPerMinute = 225;
    return Math.ceil(wordCount / wordsPerMinute);
}

const BlogPostPage = () => {
    const params = useParams();
    const slug = params?.slug as string;
    const [blog, setBlog] = useState<Blog | null>(null);
    const [recommendedBlogs, setRecommendedBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch main blog
    useEffect(() => {
        const fetchBlog = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Always fetch from global backend — single source of truth
                const globalBlog = await globalBackendService.getBlogBySlug(slug as string);
                if (globalBlog) {
                    const mappedBlog: Blog = {
                        blog_id: (globalBlog as any).id,
                        blog_title: (globalBlog as any).title,
                        blog_content: (globalBlog as any).content || '',
                        blog_description: (globalBlog as any).excerpt || '',
                        blog_feature_image: (globalBlog as any).featuredImage || '',
                        blog_slug: (globalBlog as any).slug,
                        blog_date: (globalBlog as any).publishedAt || (globalBlog as any).createdAt || '',
                        status: 'active',
                        category_name: (globalBlog as any).category || 'General',
                        comments_count: 0
                    };
                    setBlog(mappedBlog);
                } else {
                    setError('Blog post not found.');
                }
            } catch (error) {
                setError('Failed to fetch blog post');
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) fetchBlog();
    }, [slug]);

    // Fetch recommended blogs
    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const globalBlogs = await globalBackendService.getAllBlogs();
                let allBlogs: Blog[] = [];
                if (globalBlogs.length > 0) {
                    allBlogs = globalBlogs.map(blog => ({
                        blog_id: blog.id,
                        blog_title: blog.title,
                        blog_content: blog.content || '',
                        blog_description: blog.excerpt || '',
                        blog_feature_image: blog.featuredImage || '',
                        blog_slug: blog.slug,
                        blog_date: blog.publishedAt || blog.createdAt || '',
                        status: 'active',
                        category_name: blog.category || 'General',
                        comments_count: 0
                    }));
                } else {
                    const res = await fetch('/api/blogs');
                    allBlogs = await res.json();
                }
                const filtered = allBlogs
                    .filter(
                        (item) =>
                            item.blog_slug !== slug &&
                            item.category_name === blog?.category_name
                    )
                    .slice(0, 4);
                setRecommendedBlogs(filtered);
            } catch (e) {
                console.warn('Failed to fetch recommended blogs');
            }
        };

        if (blog) fetchRecommended();
    }, [blog, slug]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
    }

    if (!blog) {
        return <div className="flex items-center justify-center min-h-screen text-gray-600">Blog post not found.</div>;
    }

    const readingTime = calculateReadingTime(blog.blog_content);

    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Blogs', href: '/blogs' },
        { name: blog.blog_title, href: `/blogs/${slug}` },
    ];

    return (
        <div className="py-23 px-4 sm:px-6 lg:px-8 font-sans antialiased">
            <div className="container mx-auto max-w-[1400px] bg-white p-8 md:p-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Blog Content (2/3) */}
                    <div className="w-full lg:w-2/3">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />

                        <div className="mb-6">
                            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">{blog.blog_title}</h1>
                            <div className="flex flex-wrap items-center text-gray-500 text-sm">
                                by <span className="mx-2 text-[#4ccbc4]"><a href="https://ahealthplace.com/author/ahealthplace">{blog.category_name}</a></span> -
                                <span className="mx-2">
                                    {new Date(blog.blog_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                                <span className="font-bold">in {blog.category_name}</span>
                                <span className="ml-2">
                                    Reading Time: {readingTime} min{readingTime > 1 ? 's' : ''} read
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <img
                                src={blog.blog_feature_image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'}
                                alt={blog.blog_title}
                                className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[500px]"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80';
                                }}
                            />
                        </div>

                        <div
                            className="prose max-w-none text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: blog.blog_content }}
                        />
                    </div>

                    {/* Sidebar: Recommended (1/3) */}
                    <aside className="w-full lg:w-1/3 space-y-6">
                                
                        {/* 👉 Ad Section */}
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3">Advertisement</h2>
                            {/* Replace the below div with a real ad/image/script */}
                            <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                                Your Ad Here
                            </div>
                        </div>
                        <div className="p-4 rounded-lg mt-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended</h2>
                            <ul className="space-y-4">
                                {recommendedBlogs.length === 0 ? (
                                    <li className="text-gray-500 text-sm">No recommended blogs found.</li>
                                ) : (
                                    recommendedBlogs.slice(0, 3).map((post) => (
                                        <li key={post.blog_id}>
                                            <Link href={`/category/${post.blog_slug}`} className="flex items-start space-x-4 group">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={post.blog_feature_image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=150&q=80'}
                                                        alt={post.blog_title}
                                                        className="rounded-md object-cover w-[60px] h-[60px] transition-transform group-hover:scale-105"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=150&q=80';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#4ccbc4] transition-colors">
                                                        {post.blog_title}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(post.blog_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BlogPostPage;
