'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PortalUserPublic } from '@/lib/types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: PortalUserPublic | null;
  onClose: () => void;
  onUserDeleted: (deletedId: string) => void;
}

export function DeleteUserModal({ isOpen, user, onClose, onUserDeleted }: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete user');
        setIsLoading(false);
        return;
      }

      onUserDeleted(user.id);
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
      title="Delete Portal User"
      description="This action cannot be undone."
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 leading-relaxed">
            Are you sure you want to permanently delete the account for{' '}
            <strong className="text-red-950 font-bold">{user.name}</strong> (@{user.username})?
            They will immediately lose all access to the Zee Sip portal.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md shadow-red-700/20 transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Yes, Delete User</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
