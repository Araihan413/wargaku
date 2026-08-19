import { notFound } from 'next/navigation';
import ApiDocsClient from './_components/ApiDocsClient';

export default function ApiDocsPage() {
  // 🔒 Blokir akses dokumentasi API di server produksi
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ApiDocsClient />;
}
