"use client";

import React, { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

const breadcrumbs = [
  { name: 'Home', href: '/' },
  { name: 'FAQs', href: '/faqs' },
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for asking a new question
  const [question, setQuestion] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accordion active index
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_API_KEY || 'gbl_api_key_main_2024_v2';
  const rawBackendUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
  const backendUrl = rawBackendUrl.replace('localhost', '127.0.0.1');

  useEffect(() => {
    async function fetchFAQs() {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/faqs/public?apiKey=${apiKey}`, {
          cache: 'no-store'
        });
        if (!res.ok) throw new Error('Failed to load FAQs');
        const data = await res.json();
        setFaqs(data.faqs || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Could not fetch FAQs from global backend.');
      } finally {
        setLoading(false);
      }
    }
    fetchFAQs();
  }, [backendUrl, apiKey]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setIsSubmitting(true);
      setSubmitStatus(null);

      const res = await fetch(`${backendUrl}/api/faqs/public?apiKey=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit question.');
      }

      setSubmitStatus({
        type: 'success',
        message: 'Your question has been submitted successfully and is pending administrator review and answer.',
      });
      setQuestion('');
    } catch (err: any) {
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        {/* Hero / Header */}
        <div className="text-center my-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            Have questions about healthcare, coverages, treatments, or services? Browse our FAQs or submit your own.
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-[#4ccbc4] to-[#2fa39a] rounded-full mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
          
          {/* FAQs List Section */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-white border border-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                ⚠️ {error}
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-4xl">❓</span>
                <h3 className="text-lg font-semibold text-gray-700 mt-4">No FAQs Published Yet</h3>
                <p className="text-gray-400 text-sm mt-1">Be the first to submit a question using the form on the right!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => {
                  const isOpen = activeIndex === index;
                  return (
                    <div 
                      key={faq.id} 
                      className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:border-gray-200"
                    >
                      <button
                        onClick={() => toggleAccordion(index)}
                        className="w-full px-5 py-4 text-left font-semibold text-gray-800 flex justify-between items-center hover:bg-gray-50/50 transition duration-150"
                      >
                        <span className="pr-4">{faq.question}</span>
                        <span className={`text-xl font-light text-[#4ccbc4] transform transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                          ＋
                        </span>
                      </button>
                      
                      <div 
                        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] border-t border-gray-50' : 'max-h-0'}`}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-5 py-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-gray-50/20">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ask a Question Form Section */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-28">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Ask a Question</h2>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                Can't find the answer you are looking for? Send us your question and our administrators will review and answer it.
              </p>

              <form onSubmit={handleAskQuestion} className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    placeholder="Type your question here..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ccbc4] focus:bg-white transition"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !question.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#4ccbc4] to-[#2fa39a] text-white text-sm font-semibold rounded-lg hover:from-teal-500 hover:to-teal-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Question'}
                </button>
              </form>

              {submitStatus && (
                <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed ${submitStatus.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                  {submitStatus.message}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
