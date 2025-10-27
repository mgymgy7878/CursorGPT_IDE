import React from "react";

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Label({ 
  children, 
  htmlFor, 
  className = '', 
  style = {} 
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`label ${className}`}
      style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '4px',
        ...style
      }}
    >
      {children}
    </label>
  );
} 