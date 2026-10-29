'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalUserPublic } from '@/lib/types';
import { UserTable } from '@/components/admin/UserTable';
import { AddUserModal } from '@/components/admin/AddUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { ResetPasswordModal } from '@/components/admin/ResetPasswordModal';
import { DeleteUserModal } from '@/components/admin/DeleteUserModal';
import { Plus, Search, RefreshCw } from 'lucide-react';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<PortalUserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'distributor' | 'zeesip_staff' | 'zeesip_admin'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUserPublic | null>(null);
  const [resettingUser, setResettingUser] = useState<PortalUserPublic | null>(null);
  const [deletingUser, setDeletingUser] = useState<PortalUserPublic | null>(null);

  // Fetch users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // Handlers
  const handleUserAdded = (newUser: PortalUserPublic) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUserUpdated = (updatedUser: PortalUserPublic) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
  };

  const handleUserDeleted = (deletedId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== deletedId));
  };

  const handleToggleStatus = async (user: PortalUserPublic, nextStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        handleUserUpdated(data.user);
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-black tracking-tight">Users</h2>
          <p className="text-xs text-[#555555] mt-0.5">
            Manage distributor and staff accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadUsers()}
            disabled={isLoading}
            className="p-2 rounded-[8px] border border-[#E5E5E5] bg-white text-[#555555] hover:text-black hover:bg-neutral-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add user</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black placeholder-[#A3A3A3] focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 border border-[#E5E5E5] rounded-[8px] p-0.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 text-xs transition-colors rounded-[6px] whitespace-nowrap ${
              roleFilter === 'all'
                ? 'bg-neutral-100 text-black font-medium'
                : 'text-[#555555] hover:text-black'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('distributor')}
            className={`px-2.5 py-1 text-xs transition-colors rounded-[6px] whitespace-nowrap ${
              roleFilter === 'distributor'
                ? 'bg-neutral-100 text-black font-medium'
                : 'text-[#555555] hover:text-black'
            }`}
          >
            Distributor
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('zeesip_staff')}
            className={`px-2.5 py-1 text-xs transition-colors rounded-[6px] whitespace-nowrap ${
              roleFilter === 'zeesip_staff'
                ? 'bg-neutral-100 text-black font-medium'
                : 'text-[#555555] hover:text-black'
            }`}
          >
            Zee Sip Staff
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('zeesip_admin')}
            className={`px-2.5 py-1 text-xs transition-colors rounded-[6px] whitespace-nowrap ${
              roleFilter === 'zeesip_admin'
                ? 'bg-neutral-100 text-black font-medium'
                : 'text-[#555555] hover:text-black'
            }`}
          >
            Zee Sip Admin
          </button>
        </div>
      </div>

      {/* Users Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onEdit={(user) => setEditingUser(user)}
        onResetPassword={(user) => setResettingUser(user)}
        onDelete={(user) => setDeletingUser(user)}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modals */}
      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        isOpen={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      <ResetPasswordModal
        isOpen={Boolean(resettingUser)}
        user={resettingUser}
        onClose={() => setResettingUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        isOpen={Boolean(deletingUser)}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}
