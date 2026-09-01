"use client";

import RouteTransition from "@/components/RouteTransition";
import { PropsWithChildren, useEffect } from "react";
import { GRAPHQL_URL } from '@/lib/api/base';

export default function AppClientRoot({ children }: PropsWithChildren) {
  useEffect(() => {
    // Client-side diagnostics for GraphQL endpoint and health
    // eslint-disable-next-line no-console
    console.log('[PrepPro] Resolved GRAPHQL_URL:', GRAPHQL_URL);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const healthUrl = GRAPHQL_URL.replace(/\/graphql$/, '/health');
    fetch(healthUrl, { signal: controller.signal })
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
