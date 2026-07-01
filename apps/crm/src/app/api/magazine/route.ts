/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/magazine/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Slug generator from magazine_title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special characters
    .replace(/\s+/g, '-')           // replace spaces with hyphens
    .replace(/-+/g, '-');           // collapse multiple hyphens
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      magazine_id,
      magazine_title,
      magazine_description,
      magazine_tags,
      magazine_cover_image,
      magazine_link,
      MagCloudLink,
      magazine_date,
      magazine_category,
    } = body;

    if (!magazine_id || !magazine_title) {
      return NextResponse.json(
        { error: 'magazine_id and magazine_title are required.' },
        { status: 400 }
      );
    }

    const magazine_slug = generateSlug(magazine_title); // ✅ generate slug

    // Insert into DB with slug
    const query = `
      INSERT INTO magazines 
        (magazine_id, magazine_title, magazine_slug, magazine_description, magazine_tags, magazine_cover_image, magazine_link, MagCloudLink, magazine_date, magazine_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      magazine_id,
      magazine_title,
      magazine_slug, // ✅ new field
      magazine_description,
      magazine_tags,
      magazine_cover_image,
      magazine_link,
      MagCloudLink,
      magazine_date,
      magazine_category,
    ];

    await pool.execute(query, values);

    return NextResponse.json({ success: true, message: 'Magazine saved successfully.', slug: magazine_slug });
  } catch (error) {
    return NextResponse.json({error: 'Missing required fields'}, { status: 500 });
  }
}

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM magazines ORDER BY magazine_date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({error: 'Missing required fields'}, { status: 500 });
  }
}
