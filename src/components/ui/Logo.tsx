import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const textSize = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-semibold',
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${textSize} tracking-tight text-black select-none`}>
        Zee Sip
      </span>
    </div>
  );
}
