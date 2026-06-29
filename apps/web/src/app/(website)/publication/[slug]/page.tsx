'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

// Define a type for magazine rows (adjust fields based on your DB schema)
interface Magazine {
  idMagazines: number;
  magazine_slug: string;
  magazine_title: string;
  magazine_description: string;
  magazine_tags: string;
  magazine_cover_image: string;
  magazine_link: string;
  magazine_date: string; // ISO string
  magazine_category: string;
  magazine_timestamp: string; // ISO string
  MagCloudLink: string;
  status: number;
}

const MagazineDetailPage = () => {
  const { slug } = useParams();
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMagazine = async () => {
      try {
        const res = await fetch(`/api/magazine/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch magazine');
        const data = await res.json();
        setMagazine(data);
      } catch (err) {
        console.error('Error loading magazine:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchMagazine();
  }, [slug]);

  if (loading) {
    return <div className="p-6 text-lg">Loading magazine...</div>;
  }

  if (!magazine) {
    return <div className="p-6 text-lg text-red-600">Magazine not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-38">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        {/* Cover Image */}
        <div className="w-full md:w-1/4 shadow border-1 rounded overflow-hidden relative">

           <Image
            src={magazine.magazine_cover_image}
            alt={magazine.magazine_title}
            fill
            className="object-cover shadow"
          />
          <div className="p-0">
          <a
            href={magazine.MagCloudLink} // Replace if dynamic
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-white bg-red-600 px-4 py-2 rounded font-semibold hover:bg-red-700 transition"
          >
            Find Out More on MagCloud
          </a>
         </div>

        </div>

        {/* Magazine Description */}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{magazine.magazine_title}</h1>
          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: magazine.magazine_description }} />
          <p className="mt-6 text-sm text-gray-500 italic">
            Published on{' '}
            {new Date(magazine.magazine_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Embedded PDF Preview */}
      {magazine.MagCloudLink ? (
        <div className="w-full aspect-[3/2] rounded shadow overflow-hidden">
          <iframe
            src={magazine.MagCloudLink}
            title="Magazine PDF"
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="border p-6 text-center text-gray-600">No Content Available</div>
      )}

      {/* Featured Articles Section */}
      <h2 className="text-2xl font-bold mt-12 mb-4">Featured Articles</h2>
      <div className="border p-6 text-center text-gray-500">No Content Available</div>
    </div>
  );
};

export default MagazineDetailPage;
