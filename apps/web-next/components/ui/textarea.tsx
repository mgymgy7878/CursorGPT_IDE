import React from "react";

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Textarea({ 
  value, 
  onChange, 
  placeholder = '', 
  label,
  disabled = false,
  rows = 4,
  className = '',
  style = {}
}: TextareaProps) {
  return (
    <div className={`textarea-wrapper ${className}`}>
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="textarea"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          color: disabled ? '#9ca3af' : '#374151',
          resize: 'vertical',
          fontFamily: 'inherit',
          ...style
        }}
      />
    </div>
  );
} 