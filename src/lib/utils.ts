import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a clean username suggestion from a full name.
 * e.g. "Johnathan Smith" -> "jsmith" or "johnsmith"
 */
export function suggestUsername(name: string): string {
  if (!name) return '';
  const clean = name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  // First letter of first name + last name
  return `${parts[0][0]}${parts[parts.length - 1]}`;
}

/**
 * Generates a high-entropy cryptographically secure random password.
 * Guaranteed to have uppercase, lowercase, digits, and safe symbols.
 */
export function generateStrongPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+';

  const all = upper + lower + digits + symbols;

  // Ensure at least one of each category
  const guaranteed = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const remainingLength = Math.max(0, length - guaranteed.length);
  const remaining: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    remaining.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle together
  const combined = [...guaranteed, ...remaining];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

/**
 * Formats an ISO date string into a friendly readable date
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}
