import React from "react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Input({ 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text',
  label,
  disabled = false,
  className = '',
  style = {}
}: InputProps) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: '#374151'
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="input"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          color: disabled ? '#9ca3af' : '#374151',
          ...style
        }}
      />
    </div>
  );
} 