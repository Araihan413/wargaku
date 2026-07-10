import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/40 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center animate-bounce">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Akses Ditolak</h1>
          <p className="text-sm text-slate-400">
            Anda tidak memiliki hak akses (permission) yang cukup untuk membuka halaman ini.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-950 font-medium rounded-xl hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
