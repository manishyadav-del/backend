// app/api/hero-blogs/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface BlogRow {
  blog_id: number;
  blog_slug: string;
  blog_title: string;
  blog_description: string;
  blog_feature_image: string | null;
  blog_author: string;
  blog_date: string;
  formatted_blog_date: string;
  blog_category_id: number;
  category_name: string;
}

export async function GET() {
  try {
    const query = `
      SELECT
        b.blog_id,
        b.blog_slug,
        b.blog_title,
        b.blog_description,
        b.blog_feature_image,
     
        b.blog_date,
        DATE_FORMAT(b.blog_date, '%M %d, %Y') as formatted_blog_date,
        b.blog_category_id,
        c.category_name
      FROM blogs b
      JOIN blog_category c ON b.blog_category_id = c.category_id
      WHERE b.status = '1'
      ORDER BY b.blog_date DESC, b.blog_id DESC
      LIMIT 4
    `;

    const [rows] = await pool.query(query);

    // Format the response to match Hero component expectations
    const blogs = (rows as BlogRow[]).map(blog => ({
      blog_id: blog.blog_id,
      blog_slug: blog.blog_slug,
      blog_title: blog.blog_title,
      blog_description: blog.blog_description,
      blog_feature_image: blog.blog_feature_image || '/technology.jpg',
      blog_author: blog.blog_author,
      blog_category_id: blog.blog_category_id,
      category_name: blog.category_name || 'Uncategorized',
      blog_date: blog.formatted_blog_date?.toUpperCase() || new Date(blog.blog_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).toUpperCase()
    }));

    return NextResponse.json({
      success: true,
      blogs,
      count: blogs.length
    });
  } catch (error) {
    console.error('Error fetching hero blogs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hero blogs',
      blogs: []
    }, { status: 500 });
  }
}