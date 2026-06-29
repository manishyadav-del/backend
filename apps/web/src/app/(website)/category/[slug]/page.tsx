'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  status: string;
  category_name: string;
}

const stripHtml = (html: string): string =>
  html ? html.replace(/<[^>]*>/g, '') : '';

const CategoryPage = () => {
  const params = useParams();
  const categorySlug = decodeURIComponent((params?.slug as string) || '');
  const [visibleBlogsCount, setVisibleBlogsCount] = useState(1);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
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
          setBlogs(mappedBlogs);
        } else {
          const res = await fetch('/api/blogs');
          const data = await res.json();
          setBlogs(data);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    if (blogs.length && categorySlug) {
      const matchedBlogs = blogs.filter(
        (blog) =>
          blog.category_name?.toLowerCase().replace(/\s+/g, '-') ===
          categorySlug.toLowerCase()
      );
      setFilteredBlogs(matchedBlogs);
    }
  }, [blogs, categorySlug]);

  if (loading) {
    return <p className="p-6 text-lg">Loading blogs...</p>;
  }

  if (filteredBlogs.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">
          No blogs found in category: {categorySlug.replace(/-/g, ' ')}
        </h1>
      </div>
    );
  }

  const featuredBlog = filteredBlogs[0];

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 capitalize text-gray-900 gradient-text">
            {categorySlug.replace(/-/g, ' ')}
          </h1>
          <div className="w-24 h-1 bg-[#4ccbc4] mx-auto rounded-full"></div>
        </div>

      {/* 🔥 Top Featured Blog */}
      {featuredBlog && (
        <Link href={`/blogs/${featuredBlog.blog_slug}`}>
          <div className="relative w-full h-[350px] md:h-[450px] rounded-lg overflow-hidden mb-10">
            {/* ✅ Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={featuredBlog.blog_feature_image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'}
                alt={featuredBlog.blog_title}
                className="w-full h-full object-cover object-top absolute inset-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80';
                }}
              />
            </div>

            {/* ✅ Overlay Content */}
            <div className="absolute inset-0 z-10 bg-opacity-50 flex items-end p-6">

              <div className="bg-white bg-opacity-90 p-4 md:p-6 rounded shadow max-w-xl">
                <div className='max-w-xl absolute top-60 md:top-78 lg:top-78'>
                  <p className="bg-[#00B7E0] text-xs font-bold uppercase text-white mb-0 inline-block px-2 py-1 rounded">
                    {featuredBlog.category_name}
                  </p>
                </div>
                <h2 className="text-sm md:text-2xl font-bold text-gray-900 mt-2 mb-2">
                  {featuredBlog.blog_title}
                </h2>
                <div className="text-xs font-normal md:font-semibold uppercase tracking-wide flex items-center flex-wrap gap-1">
                  BY<span className="text-[#4ccbc4]">
                  {(featuredBlog.blog_author || "Admin").toUpperCase()}
                  </span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="text-gray-600">
                    {new Date(featuredBlog.blog_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

      )}

      {/* 🗂️ Rest of Blogs */}
      <div className="space-y-10">
        {filteredBlogs.slice(1, visibleBlogsCount + 1).map((blog) => (
          <div key={blog.blog_id} >
            <div className="gap-4 pb-6 border-b">


              {/* Title */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {blog.blog_title}
                </h2>
                <div className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center flex-wrap gap-1">
                  <span className="text-[#4dd1ca]">
                        {(blog.blog_author || "Admin").toUpperCase()}
                      </span>
                  <span className="text-gray-600">
                    {new Date(blog.blog_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Blog Card Layout */}
              <div className="flex flex-col md:flex-row w-full gap-6 pb-6">
                {/* Image Section */}
                <div className="md:w-1/3 w-full relative min-h-[200px]">
                  <img
                    src={blog.blog_feature_image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'}
                    alt={blog.blog_title}
                    className="w-full h-48 md:h-full object-cover object-top rounded-lg absolute inset-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>

                {/* Content Section */}
                <div className="md:w-2/3 w-full flex flex-col">
                  <div>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                      {stripHtml(blog.blog_content).slice(0, 250)}...
                    </p>
                  </div>
                  <a
                    href={`/blogs/${blog.blog_slug}`}
                    className="inline-block w-max text-sm font-medium text-gray-500 border border-gray-500 px-4 py-2 rounded hover:bg-[#4ccbc4] hover:text-white transition"
                  >
                    Read More
                  </a>
                </div>
              </div>

            </div>
            {visibleBlogsCount + 1 < filteredBlogs.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleBlogsCount((prev) => prev + 6)}
                  className="px-6 py-2 bg-[#4ccbc4] text-white rounded hover:bg-[#3bb3ad] transition"
                >
                  Load More
                </button>
              </div>
            )}
          </div>


        ))}
      </div>
    </div>
    </div>
  );
};

export default CategoryPage;
