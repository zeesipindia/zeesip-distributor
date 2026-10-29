'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, RefreshCw, MapPin, Calendar, FileText } from 'lucide-react';
import { DeliveredLocation } from '@/lib/types';
import { KERALA_DISTRICTS } from '@/lib/auth';

interface DistributorDetail {
  id: string;
  name: string;
  role: string;
}

interface DeliveryStats {
  total: number;
  by_district?: Record<string, number>;
  byDistrict?: Record<string, number>;
}

export default function AdminDistributorDeliveriesPage({
  params,
}: {
  params: Promise<{ distributorId: string }>;
}) {
  const resolvedParams = use(params);
  const distributorId = resolvedParams.distributorId;

  const [distributor, setDistributor] = useState<DistributorDetail | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({ total: 0, by_district: {} });
  const [locations, setLocations] = useState<DeliveredLocation[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict !== 'all') {
        params.set('district', selectedDistrict);
      }
      const res = await fetch(`/api/admin/locations/${distributorId}?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}: Failed to load distributor deliveries`);
      }
      const data = await res.json();
      setDistributor(data.distributor);
      setStats(data.stats || { total: 0, by_district: {} });
      setLocations(data.locations || []);
    } catch (err) {
      console.error('Failed to load distributor details:', err);
      setError((err as Error).message || 'Could not load delivery records');
    } finally {
      setIsLoading(false);
    }
  }, [distributorId, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
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

  // Districts that have at least 1 delivery
  const districtCounts = stats?.by_district || stats?.byDistrict || {};
  const activeDistrictsWithCount = Object.entries(districtCounts).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/locations"
          className="inline-flex items-center gap-1.5 text-xs text-[#555555] hover:text-black font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All distributors</span>
        </Link>
      </div>

      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-black tracking-tight">
            {distributor ? distributor.name : 'Distributor Deliveries'}
          </h2>
          <p className="text-xs text-[#555555] mt-0.5">
            Delivery locations and history (Read-only)
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={isLoading}
          className="p-2 rounded-[8px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Deliveries by District Summary */}
      <div className="p-4 bg-white border border-[#E5E5E5] rounded-[8px] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-black tracking-tight">Deliveries by district</span>
          <span className="text-xs font-medium text-[#555555]">
            Total: <strong className="text-black font-semibold">{stats.total}</strong>
          </span>
        </div>

        {activeDistrictsWithCount.length === 0 ? (
          <p className="text-xs text-[#888888]">No deliveries recorded yet for any district.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeDistrictsWithCount.map(([district, count]) => (
              <span
                key={district}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs bg-neutral-100 text-black border border-neutral-200"
              >
                <span className="font-medium">{district}</span>
                <span className="px-1.5 py-0.2 bg-white rounded-full text-[11px] font-semibold text-black border border-neutral-200">
                  {count}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="admin-district-filter" className="text-xs font-medium text-[#555555]">
            Filter district:
          </label>
          <select
            id="admin-district-filter"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs bg-white border border-[#E5E5E5] rounded-[8px] px-3 py-1.5 text-black focus:outline-none focus:border-black transition-colors"
          >
            <option value="all">All Districts</option>
            {KERALA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[#888888]">
          Showing {locations.length} {locations.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-[8px] border border-red-200 bg-red-50 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Delivery Records List */}
      <div className="bg-white border border-[#E5E5E5] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-neutral-50/50">
                <th className="py-3 px-4 font-medium text-black">District</th>
                <th className="py-3 px-4 font-medium text-black">Location</th>
                <th className="py-3 px-4 font-medium text-black">Details</th>
                <th className="py-3 px-4 font-medium text-black text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#888888]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Loading delivery records...</span>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#888888]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <MapPin className="w-6 h-6 text-[#888888] stroke-[1.5]" />
                      <p className="mt-1 font-medium text-black">No delivery entries</p>
                      <p className="text-[11px] text-[#555555]">
                        {selectedDistrict !== 'all'
                          ? `No entries recorded in ${selectedDistrict}.`
                          : 'This distributor has not recorded any deliveries yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                locations.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-black align-top whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-neutral-100 text-black text-[11px] font-medium border border-neutral-200">
                        {item.district}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-black font-medium align-top">
                      {item.location}
                    </td>
                    <td className="py-3.5 px-4 text-[#555555] align-top max-w-xs break-words">
                      {item.details ? item.details : <span className="text-[#AAAAAA] italic">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#555555] align-top whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
