'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '@/lib/types';
import { RefreshCw, Users, Truck, Building2, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to retrieve stats');
        setStats(null);
      } else if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError((err as Error).message || 'Network error');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users },
        { label: 'Distributors', value: stats.distributors, icon: Truck },
        { label: 'Zee Sip Staff', value: stats.staff, icon: Building2 },
        { label: 'Zee Sip Admins', value: stats.admins, icon: ShieldCheck },
        { label: 'Active Users', value: stats.activeUsers, icon: CheckCircle2 },
        { label: 'Inactive Users', value: stats.inactiveUsers, icon: XCircle },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black tracking-tight">Dashboard</h2>
          <p className="text-xs text-[#555555] mt-0.5">
            System overview
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-red-900 block">Could not load stats</span>
            <span className="text-xs text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      {!error && (
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
      )}
    </div>
  );
}
