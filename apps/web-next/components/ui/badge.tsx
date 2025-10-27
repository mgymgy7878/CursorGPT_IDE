import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  style = {}
}: BadgeProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 12px' : '4px 8px',
    borderRadius: '4px',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
    fontWeight: '500',
    ...style
  };

  const variantStyles = {
    default: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    primary: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    },
    secondary: {
      backgroundColor: '#e5e7eb',
      color: '#374151'
    },
    success: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    warning: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    }
  };

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        ...baseStyles,
        ...variantStyles[variant]
      }}
    >
      {children}
    </span>
  );
} 