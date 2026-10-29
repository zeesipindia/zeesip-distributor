'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('admin');

  // Admin state
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // User state
  const [username, setUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Status & error state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!adminPassword) {
      setErrorMessage('Please enter the admin password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      router.push(data.redirect || '/admin/users');
      router.refresh();
    } catch {
      setErrorMessage('Unable to connect to authentication service.');
      setIsLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username.trim() || !userPassword) {
      setErrorMessage('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: userPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      router.push(data.redirect || '/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Unable to connect to authentication service.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        {/* Simple Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-semibold text-black tracking-tight">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-[#555555]">
            Access the distributor management portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E5E5E5] rounded-[8px] p-6 sm:p-8">
          {/* Underline Tabs */}
          <div className="flex border-b border-[#E5E5E5] mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-2.5 text-sm font-medium transition-colors border-b-2 text-center ${
                activeTab === 'admin'
                  ? 'border-black text-black'
                  : 'border-transparent text-[#555555] hover:text-black'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-2.5 text-sm font-medium transition-colors border-b-2 text-center ${
                activeTab === 'user'
                  ? 'border-black text-black'
                  : 'border-transparent text-[#555555] hover:text-black'
              }`}
            >
              User
            </button>
          </div>

          {/* Simple Red Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Admin Form */}
          {activeTab === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-sm text-black placeholder-[#A3A3A3] focus:outline-none focus:border-black transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#555555] hover:text-black"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-black text-white rounded-[8px] py-2.5 px-4 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          ) : (
            /* User Form */
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jsmith"
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-sm text-black placeholder-[#A3A3A3] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-sm text-black placeholder-[#A3A3A3] focus:outline-none focus:border-black transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#555555] hover:text-black"
                  >
                    {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-black text-white rounded-[8px] py-2.5 px-4 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
