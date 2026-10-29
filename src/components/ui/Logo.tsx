import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export function Logo({ className = '', size = 'md', showSubtitle = true }: LogoProps) {
  const iconSize = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  const titleSize = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-extrabold',
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Emblem */}
      <div
        className={`${iconSize} relative rounded-xl bg-gradient-to-tr from-emerald-800 via-emerald-600 to-teal-500 shadow-md shadow-emerald-900/20 flex items-center justify-center text-white font-bold ring-1 ring-white/20`}
      >
        <span className="tracking-tight text-white drop-shadow-sm">ZS</span>
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white"></div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-tight">
        <span className={`${titleSize} tracking-tight text-slate-900 flex items-center gap-1.5`}>
          <span>Zee Sip</span>
          <span className="text-emerald-700 font-semibold text-xs uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
            Portal
          </span>
        </span>
        {showSubtitle && (
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Distributor Network
          </span>
        )}
      </div>
    </div>
  );
}
