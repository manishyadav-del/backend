'use client';

import React, { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs'; 
import { globalBackendClient } from '@/lib/global-backend';

interface LegalPageContent {
  title?: string;
  content?: string;
}

const TermsAndConditionsPage: React.FC = () => {
  const [cmsPage, setCmsPage] = useState<LegalPageContent | null>(null);

  useEffect(() => {
    async function fetchTerms() {
      try {
        console.log('[TermsAndConditionsPage] Fetching terms from CMS...');
        const data = await globalBackendClient.getLegalPage('terms');
        console.log('[TermsAndConditionsPage] Received data from CMS:', data);
        if (data && data.content) {
          setCmsPage(data);
        } else {
          console.warn('[TermsAndConditionsPage] CMS page data is empty or missing content field:', data);
        }
      } catch (err) {
        console.error('[TermsAndConditionsPage] Failed to fetch terms from CMS:', err);
      }
    }
    fetchTerms();
  }, []);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Terms and Conditions', href: '/terms' },
  ];

  return (
    <div className="bg-gray-50 py-23 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="container mx-auto max-w-[1400px] bg-white rounded-lg shadow-md p-8 md:p-12">
        {/* Breadcrumb Trail */}
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            {cmsPage?.title || 'Terms and Conditions'}
          </h1>
        </div>

        {cmsPage?.content ? (
          <div 
            className="prose max-w-none text-gray-600 leading-relaxed font-sans" 
            dangerouslySetInnerHTML={{ __html: cmsPage.content }} 
          />
        ) : (
          <>
            {/* Introduction */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to ahealthplace. By accessing and using our website and services, you agree to comply with and be bound by the following terms and conditions.
              </p>
            </div>

            {/* Acceptance of Terms */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By using our website and services, you confirm your acceptance of these terms. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            {/* Changes to the Terms */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Changes to the Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                ahealthplace reserves the right to modify these Terms of Use at any time. It is your responsibility to periodically review these terms to stay informed.
              </p>
            </div>

            {/* Use of Content */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Use of Content</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on this website, including text, images, graphics, and logos, is the property of ahealthplace and is protected by copyright laws. You may use the content for personal, non-commercial purposes. Any other use, including reproduction, modification, or distribution, is prohibited without our written consent.
              </p>
            </div>

            {/* User Submissions */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">User Submissions</h2>
              <p className="text-gray-600 leading-relaxed">
                By submitting content to us, whether via the website, email, or other mediums, you grant ahealthplace the perpetual and irrevocable right to use, reproduce, and display the content in any format or media.
              </p>
            </div>

            {/* Conduct */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Conduct</h2>
              <p className="text-gray-600 leading-relaxed">
                Users are expected to interact respectfully with the website and any related services. Any behavior deemed harmful, threatening, or inappropriate can result in a ban or restriction from our services.
              </p>
            </div>

            {/* Disclaimers */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Disclaimers</h2>
              <p className="text-gray-600 leading-relaxed">
                The website and its content are provided &ldquo;as is.&rdquo; ahealthplace makes no guarantees regarding the accuracy, completeness, or timeliness of the content.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Under no circumstances shall ahealthplace, its affiliates, or its partners be liable for any direct, indirect, or incidental damages resulting from the use or inability to use our services.
              </p>
            </div>

            {/* Third-party Links */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Third-party Links</h2>
              <p className="text-gray-600 leading-relaxed">
                Our website may contain links to external sites. ahealthplace is not responsible for the content or privacy practices of these sites.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These terms are governed by the laws of India. Any disputes arising from these terms will be resolved in the relevant courts of India.
              </p>
            </div>

            {/* Termination */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                ahealthplace reserves the right to terminate your access to our services at any time, without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.
              </p>
            </div>

            {/* Contact */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions regarding these terms, please contact:
              </p>
              <div className="mt-4 text-gray-600">
                <p><strong>ahealthplace</strong> (Managed by DIFM LLC)</p>
                <p><strong>Address:-</strong></p>
                <p><strong>Email:</strong> info@ahealthplace.com</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
