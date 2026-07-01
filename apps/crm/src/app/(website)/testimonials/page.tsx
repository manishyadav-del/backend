'use client';

import React, { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Testimonial {
  id: string;
  clientName: string;
  clientImage?: string;
  rating: number;
  content: string;
  company?: string;
  role?: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [form, setForm] = useState({
    clientName: '',
    rating: 5,
    content: '',
    role: '',
    company: '',
  });

  const backendUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
  const apiKey = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2';

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/testimonials/public`, {
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`${backendUrl}/api/testimonials/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Thank you! Your testimonial has been submitted and is pending review.');
        setForm({ clientName: '', rating: 5, content: '', role: '', company: '' });
      } else {
        setErrorMsg(data.error || 'Failed to submit testimonial.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Testimonials', href: '/testimonials' },
  ];

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 py-24 px-4 sm:px-6 lg:px-8 font-sans antialiased relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-[1200px] relative z-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-teal-400 uppercase bg-teal-950/50 border border-teal-800/30 px-3 py-1.5 rounded-full">
            Client Testimonials
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-4 tracking-tight">
            What Our Readers Say
          </h1>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base">
            Real stories and experiences shared by our community members and medical review partners.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Testimonials List */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="text-center py-12 text-slate-400 font-medium">Loading testimonials...</div>
            ) : testimonials.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-950/30">
                <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                No testimonials published yet. Be the first to share your experience!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="glass-card p-6 border border-slate-800/80 rounded-2xl bg-slate-950/40 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg">
                    <div>
                      {/* Rating Stars */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < t.rating ? 'text-amber-400' : 'text-slate-700'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-slate-300 italic leading-relaxed text-sm">"{t.content}"</p>
                    </div>

                    <div className="mt-6 flex items-center gap-3 border-t border-slate-800/60 pt-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-sky-600 flex items-center justify-center font-bold text-white uppercase text-sm border border-slate-700">
                        {t.clientName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{t.clientName}</h4>
                        {(t.role || t.company) && (
                          <span className="text-xs text-teal-400 font-medium">
                            {t.role} {t.role && t.company && '@'} {t.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Form */}
          <div className="glass-card p-8 border border-slate-800/80 rounded-2xl bg-slate-950/40 sticky top-28 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">Share Your Feedback</h3>
            <p className="text-xs text-slate-400 mb-6">
              Your feedback helps us improve and guides others seeking healthcare insights.
            </p>

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 text-white placeholder-slate-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Role / Profession</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Nurse"
                    className="w-full py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 text-white placeholder-slate-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Clinic Inc"
                    className="w-full py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 text-white placeholder-slate-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Rating *</label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 text-white text-sm"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                  <option value={3}>⭐⭐⭐ (3/5)</option>
                  <option value={2}>⭐⭐ (2/5)</option>
                  <option value={1}>⭐ (1/5)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Share your experience with us..."
                  className="w-full py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-900/60 text-white placeholder-slate-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2.5 rounded-lg font-bold text-sm tracking-wider uppercase transition-colors shadow-lg shadow-teal-900/20"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
