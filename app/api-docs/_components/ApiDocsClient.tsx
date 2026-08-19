'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Load SwaggerUI dynamically (non-SSR) to prevent document/window undefined issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-zinc-500">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600" />
        <p>Memuat Dokumentasi API...</p>
      </div>
    </div>
  ),
});

export default function ApiDocsClient() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/openapi" />
    </div>
  );
}
