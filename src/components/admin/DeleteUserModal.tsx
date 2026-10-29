'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PortalUserPublic } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
      title="Delete User"
      description="This action cannot be undone."
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {error}
          </div>
        )}

        <p className="text-xs text-[#555555]">
          Are you sure you want to delete <strong className="text-black">{user.name}</strong> (@{user.username})?
        </p>

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
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
