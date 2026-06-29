'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Magazine = {
  idMagazines: number;
  magazine_id: string;
  magazine_title: string;
  magazine_description: string;
  magazine_tags: string;
  magazine_cover_image: string;
  magazine_link: string;
  MagCloudLink: string;
  magazine_date: string;
  magazine_category: string;
  magazine_timestamp: string;
  magazine_slug: string; // ✅ Add this
};


export default function PublicationsPage() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMagazines = async () => {
      setIsLoading(true);

      try {
        const res = await fetch('/api/magazine');
        const data = await res.json();
        setMagazines(data);
      } catch (err) {
        console.error('Failed to fetch magazines:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <main className="max-w-7xl mx-auto py-38 px-4 pt-32 pb-12 bg-white text-gray-800">
      <h1 className="text-3xl font-bold mb-10 text-[#4ccbc4]">
        A Health Place Publishes Monthly Periodicals
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse text-center">
              <div className="h-6 bg-gray-300 mb-4 w-1/2 mx-auto rounded"></div>
              <div className="relative w-full h-80 mx-auto bg-gray-200 rounded shadow" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
            {magazines.slice(0, visibleCount).map((mag) => {

              return (
                <div key={mag.idMagazines} className="text-center">
                  <h2 className="text-2xl mb-4 font-bold">
                    {new Date(mag.magazine_date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h2>

                  <Link href={`/publication/${mag.magazine_slug}`}>
                    <div className="relative w-full h-80 mx-auto cursor-pointer">
                      <Image
                        src={mag.magazine_cover_image}
                        alt={mag.magazine_title}
                        fill
                        className="object-contain rounded shadow hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </Link>

                </div>
              );
            })}
          </div>

          {visibleCount < magazines.length && (
            <div className="mt-10 text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-[#4ccbc4] text-white rounded hover:bg-blue-500 transition"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
