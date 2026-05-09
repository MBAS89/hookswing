import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Google Analytics 4 page tracking for Single Page Applications.
 * Sends a page_view event on every route change.
 *
 * Replace GA_MEASUREMENT_ID in index.html with your actual GA4 ID.
 * Get yours at: https://analytics.google.com/analytics/web/
 */
const GA_ID = 'G-XXXXXXXXXX'; // ← Replace with your GA4 Measurement ID

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    window.gtag('config', GA_ID, {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}
