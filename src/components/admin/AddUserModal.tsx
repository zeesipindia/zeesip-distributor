'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { PortalUserPublic } from '@/lib/types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: PortalUserPublic) => void;
}

export function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'distributor' | 'zeesip_staff' | 'zeesip_admin'>('distributor');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a full name');
      return;
    }
    if (!password || password.trim().length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        setIsLoading(false);
        return;
      }

      onUserAdded(data.user);
      setIsLoading(false);
      handleClose();
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setRole('distributor');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add user"
      description="Create a new login credential."
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
            placeholder="e.g. Sarah Jenkins"
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

        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Password (min 8 characters)
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            minLength={8}
            className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={handleClose}
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
                <span>Creating...</span>
              </>
            ) : (
              <span>Create user</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
