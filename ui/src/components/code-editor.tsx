import * as React from "react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  minHeight?: string;
  className?: string;
  placeholder?: string;
  id?: string;
}

export function CodeEditor({
  className,
  value,
  onChange,
  language = "bloblang",
  minHeight = "150px",
  placeholder,
  ...props
}: CodeEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = React.useState(1);
  const [lineNumbers, setLineNumbers] = React.useState<string[]>([]);

  // Update line count when value changes
  React.useEffect(() => {
    const lines = (value || "").split("\n").length;
    setLineCount(lines);
    setLineNumbers(Array.from({ length: lines }, (_, i) => String(i + 1)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    console.log("Value changed:", e.target.value);
  };

  // Handle tab key to insert spaces instead of changing focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 2 spaces at cursor position
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      // Move cursor after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div
      className={cn(
        "relative font-mono rounded-md border border-input bg-background text-sm ring-offset-background",
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted flex items-center px-3 rounded-t-md border-b">
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-75"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-75"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-75"></div>
        </div>
        <div className="text-xs text-muted-foreground ml-auto">{language}</div>
      </div>

      <div className="pt-8 flex relative" style={{ minHeight }}>
        {/* Line numbers */}
        <div className="text-right pr-2 py-2 select-none bg-muted/50 text-muted-foreground w-10 text-xs border-r flex-shrink-0">
          {lineNumbers.map((num, i) => (
            <div key={i} className="h-[1.5rem] leading-[1.5rem]">
              {num}
            </div>
          ))}
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex min-h-full w-full resize-y bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "font-mono text-sm rounded-br-md"
          )}
          style={{
            minHeight: "inherit",
            fontFamily: "monospace",
            lineHeight: 1.5,
            tabSize: 2,
            whiteSpace: "pre-line",
          }}
          spellCheck="false"
          placeholder={placeholder}
          {...props}
        />
      </div>

      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground opacity-70">
        {lineCount} line{lineCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
