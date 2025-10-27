import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = {
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s'
  };

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? '#9ca3af' : '#3b82f6',
      color: '#ffffff',
      '&:hover': !disabled ? { backgroundColor: '#2563eb' } : {}
    },
    secondary: {
      backgroundColor: disabled ? '#9ca3af' : '#6b7280',
      color: '#ffffff',
      '&:hover': !disabled ? { backgroundColor: '#4b5563' } : {}
    },
    outline: {
      backgroundColor: 'transparent',
      color: disabled ? '#9ca3af' : '#3b82f6',
      border: `1px solid ${disabled ? '#9ca3af' : '#3b82f6'}`,
      '&:hover': !disabled ? { backgroundColor: '#f3f4f6' } : {}
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? '#9ca3af' : '#374151',
      '&:hover': !disabled ? { backgroundColor: '#f3f4f6' } : {}
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      style={{
        ...baseStyles,
        ...variantStyles[variant]
      }}
    >
      {children}
    </button>
  );
} 