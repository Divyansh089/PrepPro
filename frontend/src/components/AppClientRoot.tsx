"use client";

import RouteTransition from "@/components/RouteTransition";
import { PropsWithChildren, useEffect } from "react";
import { API_BASE_URL } from '@/lib/api/base';

export default function AppClientRoot({ children }: PropsWithChildren) {
  useEffect(() => {
    // Client-side diagnostics for API base and health
    // eslint-disable-next-line no-console
    console.log('[PrepPro] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    // eslint-disable-next-line no-console
    console.log('[PrepPro] Resolved API_BASE_URL:', API_BASE_URL);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    fetch(`${API_BASE_URL.replace(/\/$/, '')}/health`, { signal: controller.signal })
      .then(async (res) => {
        // eslint-disable-next-line no-console
        console.log('[PrepPro] Backend /health status:', res.status);
        try {
          const body = await res.json();
          // eslint-disable-next-line no-console
          console.log('[PrepPro] Backend /health body:', body);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[PrepPro] Backend /health non-JSON response');
        }
        const allowOrigin = res.headers.get('access-control-allow-origin');
        if (allowOrigin) {
          // eslint-disable-next-line no-console
          console.log('[PrepPro] CORS allow-origin:', allowOrigin);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[PrepPro] Backend /health fetch error:', err);
      })
      .finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  return <RouteTransition>{children}</RouteTransition>;
}


