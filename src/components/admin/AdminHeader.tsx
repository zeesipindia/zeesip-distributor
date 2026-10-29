'use client';

import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  onToggleSidebar,
  title = 'Users',
  subtitle = 'Manage portal access for distributors and staff',
}: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-[#E5E5E5] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-[6px] text-[#555555] hover:text-black hover:bg-neutral-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-black leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#555555] hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[#555555] font-normal hidden sm:inline-block">
          Admin
        </span>

        <button
          onClick={handleLogout}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium text-black bg-white border border-[#E5E5E5] hover:bg-neutral-50 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5 text-[#555555]" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
