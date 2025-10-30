import React from 'react';
import * as Icons from 'lucide-react';

interface IconButtonProps {
  icon: keyof typeof Icons;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function IconButton({
  icon,
  title,
  onClick,
  disabled = false,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: IconButtonProps) {
  const IconComponent = Icons[icon];

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
  };

  const variantClasses = {
    ghost: 'hover:bg-white/5 text-neutral-400 hover:text-white',
    danger: 'hover:bg-red-900/20 text-red-400 border border-red-700/50',
    neutral: 'hover:bg-zinc-800 text-neutral-400 border border-zinc-700/50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`
        inline-flex items-center justify-center rounded-xl transition-colors
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <IconComponent className="w-4 h-4" />
    </button>
  );
}
