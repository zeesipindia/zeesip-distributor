'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Package,
  ShoppingBag,
  Truck,
  BarChart3,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isReady?: boolean;
}

// Extensible navigation items: add new modules here!
export const ADMIN_MODULES: NavItem[] = [
  { name: 'Users & Access', href: '/admin/users', icon: Users, isReady: true },
  { name: 'Product Catalog', href: '/admin/products', icon: Package, isReady: false },
  { name: 'Wholesale Orders', href: '/admin/orders', icon: ShoppingBag, isReady: false },
  { name: 'Shipments & Logistics', href: '/admin/shipments', icon: Truck, isReady: false },
  { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, isReady: false },
  { name: 'Portal Settings', href: '/admin/settings', icon: Settings, isReady: false },
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-200 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="bg-white/10 p-1.5 rounded-xl">
            <Logo size="sm" showSubtitle={false} className="text-white [&_span.text-slate-900]:text-white" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations Modules
            </div>
            <nav className="space-y-1.5">
              {ADMIN_MODULES.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                if (!item.isReady) {
                  return (
                    <div
                      key={item.name}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed hover:bg-slate-900/40 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                        Phase 2
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose()}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block">Phase 1 Active</span>
              <span className="text-[11px] text-slate-400">Expandable module system</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
