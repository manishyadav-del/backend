'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

const breadcrumbs = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
];

interface Service {
  id: string;
  title: string;
  description?: string;
  image?: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder?: number;
  faqs?: { id: string; question: string }[];
}

const getIcon = (title: string) => {
  const t = (title || '').toLowerCase();
  if (t.includes('heart') || t.includes('cardio')) return '❤️';
  if (t.includes('dental') || t.includes('tooth')) return '🦷';
  if (t.includes('eye') || t.includes('vision')) return '👁️';
  if (t.includes('mental') || t.includes('psych') || t.includes('therapy')) return '🧠';
  if (t.includes('child') || t.includes('paed') || t.includes('pediatr')) return '👶';
  if (t.includes('diet') || t.includes('nutrit')) return '🥗';
  if (t.includes('physio') || t.includes('rehab')) return '💪';
  if (t.includes('lab') || t.includes('test') || t.includes('diagn')) return '🔬';
  if (t.includes('emergency') || t.includes('urgent')) return '🚑';
  if (t.includes('surgery') || t.includes('surgical')) return '🏥';
  if (t.includes('seo') || t.includes('search')) return '🔍';
  if (t.includes('marketing') || t.includes('digital')) return '📈';
  if (t.includes('web') || t.includes('develop')) return '💻';
  return '🏥';
};

function ServiceCard({ service }: { service: Service }) {
  const [hovered, setHovered] = useState(false);
  const isExternalImage =
    service.image &&
    !service.image.startsWith('/uploads') &&
    (service.image.startsWith('http') || service.image.startsWith('//'));

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#4ccbc4' : '#e5e7eb'}`,
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: hovered ? '0 12px 36px rgba(76,203,196,0.18)' : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Banner */}
      {isExternalImage ? (
        <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#f9fafb' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={service.image}
            alt={service.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100px',
            background: hovered
              ? 'linear-gradient(135deg, #4ccbc4 0%, #2fa39a 100%)'
              : 'linear-gradient(135deg, #e0fafa 0%, #b2eeeb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.75rem',
            transition: 'background 0.22s ease',
          }}
        >
          {getIcon(service.title)}
        </div>
      )}

      {/* Body */}
      <div
        style={{
          padding: '1.25rem 1.5rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: '0.6rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          {service.title}
        </h2>

        {service.description && (
          <p
            style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              margin: 0,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}
          >
            {service.description}
          </p>
        )}

        {service.faqs && service.faqs.length > 0 && (
          <span
            style={{
              alignSelf: 'flex-start',
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
            }}
          >
            {service.faqs.length} FAQ{service.faqs.length !== 1 ? 's' : ''}
          </span>
        )}

        {service.ctaText && service.ctaLink ? (
          <Link
            href={service.ctaLink}
            style={{
              marginTop: '0.5rem',
              display: 'inline-block',
              padding: '0.5rem 1.15rem',
              background: 'linear-gradient(90deg, #4ccbc4, #38a99f)',
              color: '#fff',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            {service.ctaText}
          </Link>
        ) : (
          <span
            style={{
              marginTop: '0.5rem',
              display: 'inline-block',
              padding: '0.5rem 1.15rem',
              background: '#f3f4f6',
              color: '#374151',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            Learn More
          </span>
        )}
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/dashboard/services?visibleOnly=true', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setServices(data.services || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load services');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb', paddingTop: '5.25rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 1rem;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        {/* ─── Header ─── */}
        <div style={{ textAlign: 'center', margin: '1.5rem 0 2.5rem' }}>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 0.75rem',
              lineHeight: 1.15,
            }}
          >
            Our Services
          </h1>
          <p
            style={{
              color: '#6b7280',
              fontSize: '1.05rem',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.65,
            }}
          >
            Explore the healthcare services we offer — curated to support your health journey.
          </p>
          <div
            style={{
              width: '56px',
              height: '4px',
              background: 'linear-gradient(90deg, #4ccbc4, #38a99f)',
              borderRadius: '2px',
              margin: '1.25rem auto 0',
            }}
          />
        </div>

        {/* ─── Grid ─── */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: '280px' }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '1rem',
              color: '#991b1b',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p style={{ fontWeight: 600, margin: '0 0 0.4rem' }}>Could not load services</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>{error}</p>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: '#fff',
              border: '2px dashed #e5e7eb',
              borderRadius: '1.5rem',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏥</div>
            <h2 style={{ color: '#374151', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
              No Services Added Yet
            </h2>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              Services added in the backend dashboard will appear here automatically.
            </p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
