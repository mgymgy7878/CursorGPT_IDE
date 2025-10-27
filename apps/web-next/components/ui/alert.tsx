import React from "react";

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
}

export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
  const variantStyles = {
    default: {
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
      color: '#374151'
    },
    destructive: {
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
      color: '#991b1b'
    },
    warning: {
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
      color: '#92400e'
    },
    info: {
      backgroundColor: '#dbeafe',
      borderColor: '#93c5fd',
      color: '#1e40af'
    }
  };

  return (
    <div
      className={`alert alert-${variant} ${className}`}
      style={{
        padding: '12px 16px',
        border: '1px solid',
        borderRadius: '6px',
        fontSize: '14px',
        ...variantStyles[variant]
      }}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children }: AlertDescriptionProps) {
  return <div>{children}</div>;
} 