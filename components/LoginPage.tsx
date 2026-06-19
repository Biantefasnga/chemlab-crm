import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError('Login gagal. Pastikan popup tidak diblokir browser dan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-teal-600 rounded-2xl text-white">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ChemLab Sales CRM</h1>
            <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">PT Integrasi Lab Indonesia</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Masuk menggunakan akun Google untuk mengakses dashboard CRM kamu.
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Membuka login Google...' : 'Masuk dengan Google'}
          </button>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <p className="text-[10px] text-slate-400">
          Hanya akun yang diizinkan yang dapat mengakses sistem ini.
        </p>
      </div>
    </div>
  );
}
