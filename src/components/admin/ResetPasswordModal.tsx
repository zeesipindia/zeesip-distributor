'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PortalUserPublic } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: PortalUserPublic | null;
  onClose: () => void;
}

export function ResetPasswordModal({ isOpen, user, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.trim().length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update password');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      handleModalClose();
    } catch {
      setError('Network communication failed');
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Change password"
      description={`Set a new unique password for ${user.name}.`}
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
            New Password (min 8 characters)
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type new password"
            required
            minLength={8}
            className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={handleModalClose}
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
              <span>Save password</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
