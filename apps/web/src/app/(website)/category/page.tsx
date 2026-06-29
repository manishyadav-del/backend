'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Blog {
  blog_id: number;
  blog_title: string;
  blog_category_id: number;
  blog_feature_image: string;
}

interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
  blogs: Blog[];
}

interface CategoryCard {
  name: string;
  slug: string;
  image: string;
}

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryCard[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/category');
        const result = await response.json();

        // Map all categories, no filtering
        const categoryCards: CategoryCard[] = (result.data as Category[]).map(
          (category) => ({
            name: category.category_name,
            slug: category.category_slug,
            image:
              category.blogs[0]?.blog_feature_image ||
              'https://earthbyhumans.s3-eu-central-2.ionoscloud.com/blogs/default-category.jpg',
          })
        );

        setCategories(categoryCards);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      {/* Heading */}
      <div className="max-w-[1400px] mx-auto flex-col justify-center">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-600">Explore within...</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight text-slate-900">
            BROWSE BY <span className="gradient-text">CATEGORY</span>
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-sky-500 mx-auto rounded-full mt-4"></div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center justify-center p-6 glass-card rounded-2xl text-center hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-md border border-slate-100/80 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
