// components/Analytics.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Script from 'next/script';

interface GtagEventParams {
  [key: string]: string | number | boolean;
}

interface Gtag {
  (event: 'page_view', params: { page_path: string }): void;
  (event: string, action: string, params?: GtagEventParams): void;
}

declare global {
  interface Window {
    gtag: Gtag;
    dataLayer: GtagEventParams[];
  }
}

const Analytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId) {
      console.warn('Google Analytics measurement ID is missing');
      return;
    }
    if (typeof window !== 'undefined' && window.gtag) {
      const pagePath = pathname + searchParams.toString();
      window.gtag('event', 'page_view', { page_path: pagePath });
    }
  }, [pathname, searchParams, measurementId]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
};

export default Analytics;