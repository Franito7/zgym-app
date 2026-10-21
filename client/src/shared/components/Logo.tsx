import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[size] || 'text-3xl';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <span className={`font-brand ${textSizes} font-black tracking-wide leading-none`}>
        <span className="text-blue-500 drop-shadow-[0_0_14px_rgba(37,99,235,0.8)]">
          Z-
        </span>
        <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          Gym
        </span>
      </span>
    </div>
  );
};
