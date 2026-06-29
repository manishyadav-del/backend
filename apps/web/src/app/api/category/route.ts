import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Define types for category and blog
interface Category extends RowDataPacket {
  category_id: number;
  category_name: string;
  category_slug: string;
}

interface Blog extends RowDataPacket {
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
  blog_timestamp: string;
  status: string;
  category_name: string;
  category_slug: string;
}

type CategoryWithBlogs = Category & {
  blogs: Blog[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterSlug = searchParams.get('slug');

    // Fetch categories
    const [categories] = await pool.query<Category[]>(
      `SELECT category_id, category_name, category_slug FROM blog_category`
    );

    // Fetch blogs, optionally filtered by category slug
    let blogsQuery = `
      SELECT 
        b.*, 
        c.category_name, 
        c.category_slug 
      FROM blogs b
      JOIN blog_category c ON b.blog_category_id = c.category_id
      WHERE b.status = '1'
    `;
    const queryParams: (string | number)[] = [];

    if (filterSlug) {
      blogsQuery += ` AND c.category_slug = ?`;
      queryParams.push(filterSlug);
    }

    const [blogs] = await pool.query<Blog[]>(blogsQuery, queryParams);

    // Map categories to their blogs
    const categoryMap: CategoryWithBlogs[] = categories.map((category) => {
      const categoryBlogs = blogs.filter(
        (blog) => blog.blog_category_id === category.category_id
      );
      return {
        ...category,
        blogs: categoryBlogs,
      };
    });

    // If filtering by slug, only return that category with blogs
    if (filterSlug) {
      const filteredCategory = categoryMap.find(
        (cat) => cat.category_slug === filterSlug
      );
      if (!filteredCategory) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: filteredCategory });
    }

    // Otherwise return all categories with their blogs
    return NextResponse.json({ data: categoryMap });
  } catch (error) {
    console.error('Error fetching categories and blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories and blogs' },
      { status: 500 }
    );
  }
}
