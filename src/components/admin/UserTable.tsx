'use client';

import React, { useState } from 'react';
import { PortalUserPublic } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Edit2,
  KeyRound,
  Trash2,
  Power,
  Loader2,
} from 'lucide-react';

interface UserTableProps {
  users: PortalUserPublic[];
  isLoading: boolean;
  onEdit: (user: PortalUserPublic) => void;
  onResetPassword: (user: PortalUserPublic) => void;
  onDelete: (user: PortalUserPublic) => void;
  onToggleStatus: (user: PortalUserPublic, nextStatus: boolean) => Promise<void>;
}

export function UserTable({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onDelete,
  onToggleStatus,
}: UserTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (user: PortalUserPublic) => {
    setTogglingId(user.id);
    try {
      await onToggleStatus(user, !user.is_active);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[8px] border border-[#E5E5E5] p-10 flex flex-col items-center justify-center text-[#555555]">
        <Loader2 className="w-5 h-5 text-black animate-spin mb-2" />
        <span className="text-xs">Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-[8px] border border-[#E5E5E5] p-10 text-center">
        <h3 className="text-sm font-medium text-black">No users found</h3>
        <p className="mt-1 text-xs text-[#555555] max-w-sm mx-auto">
          No user accounts match your search or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[8px] border border-[#E5E5E5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] font-medium uppercase tracking-wider text-[#555555]">
              <th className="py-2.5 px-4">User</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 hidden md:table-cell">Created</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] text-xs">
            {users.map((user) => {
              const isDistributor = user.role === 'distributor';
              const isBusy = togglingId === user.id;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50/60 transition-colors"
                >
                  {/* Name and username */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-black">
                      {user.name}
                    </div>
                    <div className="text-[#555555] font-mono text-[11px] mt-0.5">
                      @{user.username}
                    </div>
                  </td>

                  {/* Role Type */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-black">
                      {isDistributor ? 'Distributor' : 'Zee Sip staff'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium text-green-700 bg-green-50 border border-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium text-[#555555] bg-neutral-100 border border-[#E5E5E5]">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-4 text-[#555555] text-xs hidden md:table-cell">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Activate / Deactivate Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(user)}
                        disabled={isBusy}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1 rounded-[4px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit Details */}
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        title="Edit user"
                        className="p-1 rounded-[4px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Reset Password */}
                      <button
                        type="button"
                        onClick={() => onResetPassword(user)}
                        title="Reset password"
                        className="p-1 rounded-[4px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        title="Delete user"
                        className="p-1 rounded-[4px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
