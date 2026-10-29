'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PortalUserPublic } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: PortalUserPublic | null;
  onClose: () => void;
  onUserUpdated: (updated: PortalUserPublic) => void;
}

export function EditUserModal({ isOpen, user, onClose, onUserUpdated }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'distributor' | 'zeesip_staff' | 'zeesip_admin'>('distributor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update user');
        setIsLoading(false);
        return;
      }

      onUserUpdated(data.user);
      setIsLoading(false);
      onClose();
    } catch {
      setError('Network communication failed');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      description="Update name or type"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-black mb-1">
            User Type
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'distributor' | 'zeesip_staff' | 'zeesip_admin')}
            className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
          >
            <option value="distributor">Distributor</option>
            <option value="zeesip_staff">Zee Sip Staff</option>
            <option value="zeesip_admin">Zee Sip Admin</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-[8px] text-xs text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save changes</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
