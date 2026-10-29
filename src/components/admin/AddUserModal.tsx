'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { suggestUsername, generateStrongPassword } from '@/lib/utils';
import { Copy, Check, Loader2 } from 'lucide-react';
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
      setError('Please provide a name');
      return;
    }
    if (!username.trim()) {
      setError('Please provide a username');
      return;
    }
    if (!password) {
      setError('Please enter or generate a password');
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'User Created' : 'Add user'}
      description={
        createdResult
          ? 'Copy and share this password now. It will not be shown again.'
          : 'Create a new distributor or staff login.'
      }
      maxWidth="md"
    >
      {createdResult ? (
        <div className="space-y-4">
          <div className="p-3 rounded-[6px] border border-[#E5E5E5] bg-neutral-50 text-xs">
            <span className="font-medium text-black block">{createdResult.user.name}</span>
            <span className="text-[#555555]">@{createdResult.user.username} &bull; {createdResult.user.role === 'distributor' ? 'Distributor' : 'Zee Sip staff'}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">
              One-Time Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdResult.plainPassword}
                className="flex-1 bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-xs font-mono text-black select-all"
              />
              <button
                type="button"
                onClick={handleCopyPassword}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
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
              className="px-4 py-2 rounded-[8px] bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              required
              className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">
              Type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'distributor' | 'zeesip_staff')}
              className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs text-black focus:outline-none focus:border-black"
            >
              <option value="distributor">Distributor</option>
              <option value="zeesip_staff">Zee Sip staff</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-black">
                Username
              </label>
              {!isUsernameCustom && username && (
                <span className="text-[10px] text-[#555555]">Auto-suggested</span>
              )}
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username"
              required
              className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs font-mono text-black focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-black">
                Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-black hover:underline"
              >
                Generate strong
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password or click Generate"
              required
              className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs font-mono text-black focus:outline-none focus:border-black"
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
      )}
    </Modal>
  );
}
