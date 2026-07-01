import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params;

    if(!slug) {
        console.log("Missing slug param:", context);
        return NextResponse.json({error: "Missing slug"}, {status: 400});
    }

    try{
        console.log(`fetching blog with slug: ${slug}`);

        const [rows]= await pool.query(

            `
            SELECT * from magazines WHERE magazine_slug = ?
            `,
            [slug]
        );

        if(!Array.isArray(rows) || rows.length === 0){
            return NextResponse.json({error: 'blog not found'}, {status: 404});
        }

        return NextResponse.json(rows[0]);
    } catch (error){
        console.error('Error fetching blog:', error);
        return NextResponse.json(
            {error: 'failed to fetch blog'},
            {status: 500}
        );
    }

}