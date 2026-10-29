'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { suggestUsername, generateStrongPassword } from '@/lib/utils';
import { KeyRound, RefreshCw, Copy, Check, AlertTriangle, UserCheck, Loader2 } from 'lucide-react';
import { PortalUserPublic } from '@/lib/types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: PortalUserPublic) => void;
}

export function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'distributor' | 'zeesip_staff'>('distributor');
  const [username, setUsername] = useState('');
  const [isUsernameCustom, setIsUsernameCustom] = useState(false);
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success view state (showing the password ONCE)
  const [createdResult, setCreatedResult] = useState<{
    user: PortalUserPublic;
    plainPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isUsernameCustom) {
      setUsername(suggestUsername(val));
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setIsUsernameCustom(true);
  };

  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword(14);
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a full name');
      return;
    }
    if (!username.trim()) {
      setError('Please provide a username');
      return;
    }
    if (!password) {
      setError('Please set or generate a password');
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
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        setIsLoading(false);
        return;
      }

      onUserAdded(data.user);
      setCreatedResult({
        user: data.user,
        plainPassword: password,
      });
      setIsLoading(false);
    } catch {
      setError('Network error while communicating with server.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all form state
    setName('');
    setRole('distributor');
    setUsername('');
    setIsUsernameCustom(false);
    setPassword('');
    setError(null);
    setCreatedResult(null);
    setCopied(false);
    onClose();
  };

  const handleCopyPassword = () => {
    if (createdResult?.plainPassword) {
      navigator.clipboard.writeText(createdResult.plainPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'User Created Successfully' : 'Add New Portal User'}
      description={
        createdResult
          ? 'Securely share these credentials with the user.'
          : 'Create a new login for a distributor partner or Zee Sip internal staff.'
      }
      maxWidth="md"
    >
      {createdResult ? (
        /* Single-view password reveal state */
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-emerald-950 block">
                {createdResult.user.name} ({createdResult.user.role === 'distributor' ? 'Distributor' : 'Zee Sip Staff'})
              </span>
              <span className="text-emerald-700 font-mono text-xs">
                Username: @{createdResult.user.username}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>One-Time Password Display</span>
            </div>
            <p className="text-xs text-amber-900 mb-3 leading-relaxed">
              For security, this password is hashed with bcrypt and cannot be retrieved later.
              Please copy and share it with the user right now.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 select-all tracking-wide break-all">
                {createdResult.plainPassword}
              </div>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      ) : (
        /* Create user form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Sarah Jenkins or Metro Beverages"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Role / Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              User Type / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'distributor' | 'zeesip_staff')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="distributor">Distributor</option>
              <option value="zeesip_staff">Zee Sip Staff</option>
            </select>
          </div>

          {/* Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Username
              </label>
              {!isUsernameCustom && username && (
                <span className="text-[11px] text-emerald-700 font-medium">Auto-suggested</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-xs">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                required
                className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or click Generate"
                required
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Generated passwords will be displayed once after creation for you to copy.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Create User</span>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
