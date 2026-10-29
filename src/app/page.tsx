'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('Incorrect password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Incorrect password');
        setIsLoading(false);
        return;
      }

      router.push(data.redirect || '/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Incorrect password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4 sm:px-6">
      <div className="w-full max-w-xs mx-auto">
        {/* Simple Brand */}
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-sm text-black placeholder-[#A3A3A3] focus:outline-none focus:border-black transition-colors pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#555555] hover:text-black"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 font-normal">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white rounded-[8px] py-2 px-4 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
