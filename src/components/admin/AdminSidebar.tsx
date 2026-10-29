'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Package, ShoppingBag, Truck, BarChart3, Settings, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isReady?: boolean;
}

export const ADMIN_MODULES: NavItem[] = [
  { name: 'Users', href: '/admin/users', icon: Users, isReady: true },
  { name: 'Products', href: '/admin/products', icon: Package, isReady: false },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, isReady: false },
  { name: 'Shipments', href: '/admin/shipments', icon: Truck, isReady: false },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, isReady: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, isReady: false },
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-none lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E5E5E5] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
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
            <div className="px-2 mb-2 text-[11px] font-medium uppercase tracking-wider text-[#737373]">
              Modules
            </div>
            <nav className="space-y-1">
              {ADMIN_MODULES.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                if (!item.isReady) {
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-xs font-normal text-[#A3A3A3] select-none cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#A3A3A3]" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] text-[#A3A3A3]">
                        Soon
                      </span>
                    </div>
                  );
                }

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
