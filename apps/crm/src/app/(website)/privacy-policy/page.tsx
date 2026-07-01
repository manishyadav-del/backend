'use client';

import React, { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs'; 
import { globalBackendClient } from '@/lib/global-backend';

interface LegalPageContent {
  title?: string;
  content?: string;
}

const PrivacyPolicyPage: React.FC = () => {
  const [cmsPage, setCmsPage] = useState<LegalPageContent | null>(null);

  useEffect(() => {
    async function fetchPrivacy() {
      try {
        console.log('[PrivacyPolicyPage] Fetching privacy policy from CMS...');
        const data = await globalBackendClient.getLegalPage('privacy');
        console.log('[PrivacyPolicyPage] Received data from CMS:', data);
        if (data && data.content) {
          setCmsPage(data);
        } else {
          console.warn('[PrivacyPolicyPage] CMS page data is empty or missing content field:', data);
        }
      } catch (err) {
        console.error('[PrivacyPolicyPage] Failed to fetch privacy policy from CMS:', err);
      }
    }
    fetchPrivacy();
  }, []);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
  ];

  return (
    <div className="bg-gray-50 py-23 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="container mx-auto max-w-[1400px] bg-white rounded-lg shadow-md p-8 md:p-12">
        {/* Breadcrumb Trail */}
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            {cmsPage?.title || 'Privacy Policy'}
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
                At ahealthplace, we prioritize the privacy of our users, contributors, and partners. This Privacy Policy outlines the types of personal information we collect, how we use it, and the measures we take to protect it.
              </p>
            </div>

            {/* Managed by DIFM LLC */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Managed by DIFM LLC</h2>
              <p className="text-gray-600 leading-relaxed">
                Please note that ahealthplace’s operations within the country are under the management of DIFM LLC. This management relationship means that DIFM LLC oversees the data handling, processing, and storage for ahealthplace in compliance with all applicable laws and regulations.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed">
                When you interact with our platforms, we may collect:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Personal details like name, email address, phone number, etc.</li>
                <li>Portfolio submissions, photographs, or any form of content you submit.</li>
                <li>Usage data like IP address, browser type, and other standard web log information.</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">
                Your data is used for:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                <li>Publishing and promoting the content you submit.</li>
                <li>Responding to inquiries or feedback.</li>
                <li>Sending updates, newsletters, or marketing communications (only if you’ve opted in).</li>
              </ul>
            </div>

            {/* Protection of Data */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Protection of Data</h2>
              <p className="text-gray-600 leading-relaxed">
                We utilize robust security measures to ensure that your data is protected from unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            {/* Sharing & Disclosure */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Sharing & Disclosure</h2>
              <p className="text-gray-600 leading-relaxed">
                ahealthplace, under DIFM LLC’s management, may share your data with third-party service providers solely for the purpose of operations. However, these entities are bound by confidentiality obligations.
              </p>
            </div>

            {/* Cookies & Tracking */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cookies & Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                Our website may use cookies to enhance user experience. These cookies don’t collect personal information but give insights into user preferences and site interactions.
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">
                You have the right to access, correct, or delete your personal data held by ahealthplace. Please contact us for any requests related to your data.
              </p>
            </div>

            {/* Changes to this Policy */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Changes to this Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                This Privacy Policy might be updated periodically to reflect changes in our data practices. We recommend reviewing it from time to time.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For any queries regarding this Privacy Policy or your data, please contact:
              </p>
              <div className="mt-4 text-gray-600">
                <p><strong>ahealthplace</strong> (Managed by DIFM LLC)</p>
                <p><strong>Email:</strong> info@ahealthplace.com</p>
              </div>
            </div>

            {/* Conclusion */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Conclusion</h2>
              <p className="text-gray-600 leading-relaxed">
                Your trust is invaluable to us. We are committed to safeguarding your information and maintaining transparency in all our operations.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
