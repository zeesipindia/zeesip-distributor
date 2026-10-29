'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, ChevronRight, MapPin, Truck } from 'lucide-react';
import { DistributorDeliverySummary } from '@/lib/types';

export default function AdminLocationsPage() {
  const router = useRouter();
  const [distributors, setDistributors] = useState<DistributorDeliverySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDistributors = useCallback(async (query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const q = query !== undefined ? query : searchQuery;
      if (q.trim()) {
        params.set('search', q.trim());
      }
      const res = await fetch(`/api/admin/locations?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}: Failed to load distributors`);
      }
      const data = await res.json();
      setDistributors(data.distributors || []);
    } catch (err) {
      console.error('Failed to load distributor locations:', err);
      setError((err as Error).message || 'Could not load distributors');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDistributors();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadDistributors]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-black tracking-tight">Delivered Locations</h2>
          <p className="text-xs text-[#555555] mt-0.5">
            Monitor and review delivery activity logged by distributors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadDistributors()}
            disabled={isLoading}
            className="p-2 rounded-[8px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <input
            type="text"
            placeholder="Search distributor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E5E5E5] rounded-[8px] text-black placeholder-[#888888] focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-[8px] border border-red-200 bg-red-50 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Distributors Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-neutral-50/50">
                <th className="py-3 px-4 font-medium text-black">Distributor Name</th>
                <th className="py-3 px-4 font-medium text-black text-center">Total Deliveries</th>
                <th className="py-3 px-4 font-medium text-black">Last Delivery Date</th>
                <th className="py-3 px-4 font-medium text-black text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#888888]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Loading distributors...</span>
                    </div>
                  </td>
                </tr>
              ) : distributors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#888888]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Truck className="w-6 h-6 text-[#888888] stroke-[1.5]" />
                      <p className="mt-1 font-medium text-black">No distributors found</p>
                      <p className="text-[11px] text-[#555555]">
                        {searchQuery ? 'Try clearing your search query.' : 'No active or inactive distributor accounts.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                distributors.map((d) => {
                  const lastFormatted = formatDate(d.last_delivery_at);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => router.push(`/admin/locations/${d.id}`)}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-medium text-black">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:underline underline-offset-2">{d.name}</span>
                          {!d.is_active && (
                            <span className="text-[10px] uppercase tracking-wider font-medium text-[#888888] bg-neutral-100 px-1.5 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-neutral-100 text-black">
                          {d.total_deliveries}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {lastFormatted ? (
                          <span className="text-black">{lastFormatted}</span>
                        ) : (
                          <span className="text-[#888888]">No deliveries yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/locations/${d.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-[#555555] group-hover:text-black font-medium transition-colors"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
