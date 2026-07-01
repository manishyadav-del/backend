'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    // Default to the seeded project ID clx1234567890abcdef02 if env variable not present
    const projectId = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_WEBSITE_ID || 'clx1234567890abcdef02';
    const backendUrl = process.env.NEXT_PUBLIC_GLOBAL_BACKEND_URL || 'http://localhost:3000';
    const trackUrl = `${backendUrl}/api/visitors/track`;

    // Detect browser and device type
    const ua = navigator.userAgent;
    let device = 'desktop';
    if (/Mobi|Android|iPhone/i.test(ua)) {
      device = 'mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      device = 'tablet';
    }

    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    // Parse referrer / source
    let source = 'direct';
    const ref = document.referrer;
    if (ref) {
      try {
        const refUrl = new URL(ref);
        if (refUrl.hostname !== window.location.hostname) {
          source = refUrl.hostname.replace('www.', '');
        }
      } catch {}
    }

    // Check query params for utm campaign or similar source override
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) source = utmSource;

    const reportPageVisit = async () => {
      try {
        await fetch(trackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            sessionId,
            page: pathname || '/',
            userAgent: ua,
            device,
            browser,
            source,
            ip: '127.0.0.1', // Backend handles IP/Geo resolution
            country: 'US', // Fallback, normally fetched by geo-ip on server
          })
        });
      } catch (err) {
        console.error('Error reporting visitor session:', err);
      }
    };

    // Report immediately on page load/change
    reportPageVisit();

    // Heartbeat every 15 seconds to stay active (stale threshold in backend is 30s)
    const interval = setInterval(reportPageVisit, 15000);

    // Unregister session as active on page hide / unload
    const handleUnload = () => {
      try {
        fetch(trackUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          keepalive: true
        });
      } catch {}
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname]);

  return null;
}
