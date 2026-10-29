'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PortalUserPublic } from '@/lib/types';
import { generateStrongPassword } from '@/lib/utils';
import { Copy, Check, Loader2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: PortalUserPublic | null;
  onClose: () => void;
}

export function ResetPasswordModal({ isOpen, user, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-time display state
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleGenerate = () => {
    setPassword(generateStrongPassword(14));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setRevealedPassword(password);
      setIsLoading(false);
    } catch {
      setError('Network communication failed');
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (revealedPassword) {
      navigator.clipboard.writeText(revealedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleModalClose = () => {
    setPassword('');
    setError(null);
    setRevealedPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={revealedPassword ? 'Password Reset' : `Reset password`}
      description={
        revealedPassword
          ? `Copy this password for @${user.username}. It will not be shown again.`
          : `Create a new password for ${user.name} (@${user.username}).`
      }
      maxWidth="md"
    >
      {revealedPassword ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">
              New Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={revealedPassword}
                className="flex-1 bg-white border border-[#D4D4D4] rounded-[8px] px-3 py-2 text-xs font-mono text-black select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
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
              onClick={handleModalClose}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-black">
                New Password
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-[11px] text-black hover:underline"
              >
                Generate strong
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password or click Generate"
              required
              className="w-full px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-[8px] text-xs font-mono text-black focus:outline-none focus:border-black"
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
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update password</span>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
