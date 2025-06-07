import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface TextInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  previewMode?: boolean;
  placeholder?: string;
  small?: boolean;
}

export function TextInputField({ 
  value, 
  onChange, 
  previewMode = false, 
  placeholder = "", 
  small = false 
}: TextInputFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const displayValue = value 
    ? value.length > 30 
      ? `${value.substring(0, 30)}...` 
      : value
    : previewMode ? "No value configured" : placeholder;

  const heightClass = small ? "h-4" : "h-6";
  const textSizeClass = small ? "text-xs" : "text-sm";
  const fontSize = small ? '11px' : '13px';

  if (previewMode) {
    return (
      <div className="relative">
        <div
          className={`${heightClass} ${textSizeClass} p-1 text-left border rounded cursor-default`}
          style={{
            fontFamily: 'monospace',
            fontSize,
            color: value ? '#22c55e' : '#6b7280',
            backgroundColor: '#2a2a2a',
            border: '1px solid #404040',
            minWidth: small ? '100px' : '150px',
          }}
          onMouseEnter={() => value && value.length > 30 && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {displayValue}
        </div>
        {showTooltip && value && value.length > 30 && (
          <div 
            className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-black text-white text-xs rounded shadow-lg max-w-md max-h-48 overflow-auto border"
            style={{ 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {value}
          </div>
        )}
      </div>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${heightClass} ${textSizeClass} p-1 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500`}
      style={{
        fontFamily: 'monospace',
        fontSize,
        color: '#22c55e',
        backgroundColor: '#2a2a2a',
        border: '1px solid #404040',
      }}
      placeholder={placeholder}
    />
  );
} 