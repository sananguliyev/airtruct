import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";

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
  small = false,
}: TextInputFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const displayValue = value
    ? value.length > 30
      ? `${value.substring(0, 30)}...`
      : value
    : previewMode
      ? "No value configured"
      : placeholder;

  const heightClass = small ? "h-4" : "h-6";
  const textSizeClass = small ? "text-xs" : "text-sm";
  const fontSize = small ? "11px" : "13px";

  if (previewMode) {
    return (
      <div className="relative">
        <div
          className={`${heightClass} ${textSizeClass} p-1 text-left border border-border rounded cursor-default bg-background
            font-mono ${value ? (isDark ? "text-green-400" : "text-green-600") : "text-muted-foreground"}`}
          style={{
            fontSize,
            minWidth: small ? "100px" : "150px",
          }}
          onMouseEnter={() =>
            value && value.length > 30 && setShowTooltip(true)
          }
          onMouseLeave={() => setShowTooltip(false)}
        >
          {displayValue}
        </div>
        {showTooltip && value && value.length > 30 && (
          <div
            className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-popover text-popover-foreground text-xs rounded shadow-lg max-w-md max-h-48 overflow-auto border border-border font-mono"
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
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
      className={`${heightClass} ${textSizeClass} p-1 bg-background border-border text-foreground 
        focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring 
        font-mono ${isDark ? "text-green-400" : "text-green-600"}`}
      style={{
        fontSize,
      }}
      placeholder={placeholder}
    />
  );
}
