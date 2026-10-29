'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/lib/types';
import { RefreshCw, Users, Truck, Building2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    distributors: 0,
    staff: 0,
    admins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Distributors', value: stats.distributors, icon: Truck },
    { label: 'Zee Sip Staff', value: stats.staff, icon: Building2 },
    { label: 'Zee Sip Admins', value: stats.admins, icon: ShieldCheck },
    { label: 'Active Users', value: stats.activeUsers, icon: CheckCircle2 },
    { label: 'Inactive Users', value: stats.inactiveUsers, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black tracking-tight">Dashboard</h2>
          <p className="text-xs text-[#555555] mt-0.5">
            System overview and active user metrics
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchStats()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E5E5] bg-white text-xs font-medium text-black hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-[#E5E5E5] rounded-[8px] p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#555555]">{card.label}</span>
                <Icon className="w-4 h-4 text-[#737373]" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-semibold text-black tracking-tight">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
