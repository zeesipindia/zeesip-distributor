'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DeliveredLocation } from '@/lib/types';
import { KERALA_DISTRICTS } from '@/lib/auth';

const DISTRICT_EXAMPLES: Record<string, string> = {
  Thiruvananthapuram: 'e.g. Kazhakkoottam',
  Kollam: 'e.g. Karunagappalli',
  Pathanamthitta: 'e.g. Thiruvalla',
  Alappuzha: 'e.g. Cherthala',
  Kottayam: 'e.g. Changanassery',
  Idukki: 'e.g. Thodupuzha',
  Ernakulam: 'e.g. Aluva',
  Thrissur: 'e.g. Chalakudy',
  Palakkad: 'e.g. Ottapalam',
  Malappuram: 'e.g. Tirur',
  Kozhikode: 'e.g. Koyilandy',
  Wayanad: 'e.g. Sulthan Bathery',
  Kannur: 'e.g. Taliparamba',
  Kasaragod: 'e.g. Kanhangad',
};
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, MapPin, Loader2, Calendar } from 'lucide-react';

export default function DistributorLocationsPage() {
  const [locations, setLocations] = useState<DeliveredLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [district, setDistrict] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter state
  const [filterDistrict, setFilterDistrict] = useState<string>('all');

  // Delete modal state
  const [deletingLocation, setDeletingLocation] = useState<DeliveredLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch locations
  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDistrict !== 'all') {
        params.set('district', filterDistrict);
      }
      const res = await fetch(`/api/locations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('[LOAD_LOCATIONS_CLIENT_ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterDistrict]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Handle Add Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!district) {
      setFormError('Please select a district');
      return;
    }
    if (!location.trim()) {
      setFormError('Please enter a location');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district,
          location: location.trim(),
          details: details.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record location');
        setIsSubmitting(false);
        return;
      }

      // Prepend newly added location
      setLocations((prev) => [data.location, ...prev]);
      setLocation('');
      setDetails('');
      setIsSubmitting(false);
    } catch {
      setFormError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/locations/${deletingLocation.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLocations((prev) => prev.filter((loc) => loc.id !== deletingLocation.id));
        setDeletingLocation(null);
      }
    } catch (err) {
      console.error('[DELETE_LOCATION_CLIENT_ERROR]', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white antialiased flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="min-h-[44px] inline-flex items-center gap-2 text-xs font-medium text-black hover:text-[#555555] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-semibold text-black">Delivered Locations</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-black tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-black" />
            <span>Record Delivered Location</span>
          </h1>
          <p className="text-xs text-[#555555] mt-0.5">
            Log your store and retail deliveries across Kerala districts.
          </p>
        </div>

        {/* Add Location Form */}
        <div className="border border-[#E5E5E5] rounded-[8px] p-4 sm:p-5 bg-white">
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            {formError && (
              <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* 1. District Dropdown */}
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                District <span className="text-red-600">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="">Select District</option>
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Location */}
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={district ? (DISTRICT_EXAMPLES[district] || 'e.g. Taliparamba, Kozhikode') : 'e.g. Taliparamba, Kozhikode'}
                required
                maxLength={200}
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* 3. Note textarea */}
            <div>
              <label className="block text-xs font-medium text-black mb-1">
                Note (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add a note if you want"
                maxLength={500}
                rows={2}
                className="w-full p-3 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
              />
            </div>

            {/* 4. Add Button */}
            <button
              type="submit"
              disabled={isSubmitting || !district || !location.trim()}
              className="w-full min-h-[44px] bg-black text-white text-xs font-medium rounded-[8px] hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Location</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Entries Header and District Filter */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-black">Your Deliveries</h2>
              <span className="text-xs text-[#555555]">
                {locations.length} {locations.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {/* Filter by district */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#555555] hidden sm:inline">Filter:</span>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="min-h-[44px] px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
              >
                <option value="all">All Districts</option>
                {KERALA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List of Entries (Mobile Stacked Cards) */}
          {isLoading ? (
            <div className="border border-[#E5E5E5] rounded-[8px] p-8 text-center text-[#555555]">
              <Loader2 className="w-5 h-5 text-black animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading records...</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="border border-[#E5E5E5] rounded-[8px] p-8 text-center">
              <MapPin className="w-6 h-6 text-[#A3A3A3] mx-auto mb-2" />
              <p className="text-xs font-medium text-black">No deliveries recorded yet</p>
              <p className="text-xs text-[#555555] mt-0.5">
                Use the form above to add your first delivery location.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="border border-[#E5E5E5] rounded-[8px] p-4 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-neutral-400 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-neutral-100 text-black border border-[#E5E5E5]">
                        {loc.district}
                      </span>
                      <span className="text-xs font-semibold text-black">
                        {loc.location}
                      </span>
                    </div>

                    {loc.details && (
                      <p className="text-xs text-[#555555] pt-1 leading-relaxed">
                        {loc.details}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-[#737373] pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(loc.created_at)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingLocation(loc)}
                    className="min-h-[44px] sm:min-h-0 self-end sm:self-start p-2 text-[#737373] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors"
                    title="Delete location"
                    aria-label="Delete location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deletingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white border border-[#E5E5E5] rounded-[8px] p-5 max-w-sm w-full space-y-3">
            <h3 className="text-sm font-semibold text-black">Delete location?</h3>
            <p className="text-xs text-[#555555]">
              Are you sure you want to delete <strong className="text-black">{deletingLocation.location}</strong> ({deletingLocation.district})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
              <button
                type="button"
                onClick={() => setDeletingLocation(null)}
                disabled={isDeleting}
                className="min-h-[44px] px-3 py-2 text-xs text-[#555555] hover:text-black rounded-[8px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-[8px] transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
