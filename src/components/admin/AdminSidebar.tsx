'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, MapPin, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const ADMIN_MODULES = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Delivered Locations', href: '/admin/locations', icon: MapPin },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-[#E5E5E5] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#E5E5E5]">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#555555] hover:text-black hover:bg-neutral-100 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <div>
            <div className="px-2.5 mb-2 text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Menu
            </div>
            <nav className="space-y-0.5">
              {ADMIN_MODULES.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose()}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 text-black'
                        : 'text-[#555555] hover:bg-neutral-50 hover:text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-black" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
