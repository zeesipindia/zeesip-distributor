'use client';

import React, { useState } from 'react';
import { PortalUserPublic } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Edit2,
  KeyRound,
  Trash2,
  Power,
  CheckCircle,
  XCircle,
  Truck,
  Building2,
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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-sm">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <span className="text-sm font-medium">Loading user records...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No users found</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          No user accounts match your search or filter criteria. Click &quot;Add User&quot; above to create a new portal account.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4 sm:px-6">User & Identity</th>
              <th className="py-3.5 px-4">Role / Type</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Created Date</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map((user) => {
              const isDistributor = user.role === 'distributor';
              const isBusy = togglingId === user.id;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Name and username */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDistributor
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 leading-tight">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role Type */}
                  <td className="py-4 px-4">
                    {isDistributor ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Distributor</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Zee Sip Staff</span>
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-4 px-4 text-xs text-slate-500 hidden md:table-cell">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Activate / Deactivate Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(user)}
                        disabled={isBusy}
                        title={user.is_active ? 'Deactivate account' : 'Activate account'}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                          user.is_active
                            ? 'text-amber-700 hover:bg-amber-50 border-amber-200/80 bg-white'
                            : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-white'
                        } disabled:opacity-50`}
                      >
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit Details */}
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        title="Edit name & role"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Reset Password */}
                      <button
                        type="button"
                        onClick={() => onResetPassword(user)}
                        title="Reset password (show once)"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        title="Delete account"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
