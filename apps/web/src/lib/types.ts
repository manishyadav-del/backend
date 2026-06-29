// Path: lib/types.ts

// Define the type for a blog entry to ensure consistency
export interface Blog {
    blog_id: number;
    blog_title: string;
    blog_feature_image: string;
    blog_slug: string;
    formatted_blog_date: string;
    status: 'active' | 'deleted';
    category_id?: number;
    created_at?: Date;
}

// Define the type for a category
export interface BlogCategory {
    category_id: number;
    category_name: string;
    created_at?: Date;
}
