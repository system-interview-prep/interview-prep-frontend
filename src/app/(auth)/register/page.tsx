'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageProvider';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: call authService.register({ name, email, password })
    console.log('register', email);
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">{t('register.title')}</h1>
        <input
          type="text"
          placeholder={t('register.fullName')}
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder={t('register.email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder={t('register.password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white rounded py-2 font-semibold disabled:opacity-50"
        >
          {loading ? t('register.creating') : t('register.register')}
        </button>
        <p className="text-sm text-center">
          {t('register.haveAccount')}{' '}
          <Link href="/login" className="text-blue-600 underline">
            {t('register.signIn')}
          </Link>
        </p>
      </form>
    </main>
  );
}
