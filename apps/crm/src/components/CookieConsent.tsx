'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useComponentData, useGlobalBackend } from '@global/global-backend-next';

const CookieConsent = () => {
  const sdk = useGlobalBackend();
  const { data: config } = useComponentData(sdk, 'CookieConsent', {
    text: 'We use cookies to ensure that we give you the best experience on our website. If you continue to use this site we will assume that you are happy with it.',
    buttonText: 'Ok',
    backgroundColor: '#4ccbc4'
  });
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = Cookies.get('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = async () => {
    Cookies.set('cookieConsent', 'accept', { expires: 365 });
    setShowBanner(false);

    try {
      const res = await fetch('/api/cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent: true,
          name: 'cookies',
          value: 'accepted',
          domain: window.location.hostname,
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),

      });
      const data = await res.json();
      console.log('Consent saved:', data);

    } catch (error) {
      console.error('Error saving consent:', error)
    }
  };


  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 w-full text-white text-sm p-4 flex flex-col md:flex-row items-center justify-center gap-4 z-50"
      style={{ backgroundColor: config?.backgroundColor || '#4ccbc4' }}
    >
      <p className="text-center md:text-left">
        {config?.text || 'We use cookies to ensure that we give you the best experience on our website. If you continue to use this site we will assume that you are happy with it.'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={acceptCookies}
          className="bg-lime-400 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
        >
          {config?.buttonText || 'Ok'}
        </button>
        <Link
          href="/privacy-policy"
          className="bg-lime-400 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
        >
          Privacy policy
        </Link>
      </div>
    </div>
  );
};

export default CookieConsent;
