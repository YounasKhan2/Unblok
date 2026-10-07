import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search issues by key or title... (Press /)',
  className = '',
  inputRef,
}) => {
  const localRef = useRef<HTMLInputElement>(null);
  const resolvedRef = inputRef || localRef;

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 absolute left-2.5 text-text-muted pointer-events-none" />
      <input
        ref={resolvedRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-8 pr-12 text-xs bg-surface-subtle hover:bg-surface-muted focus:bg-surface-base text-text-primary placeholder:text-text-muted border border-border focus:border-accent rounded-[6px] focus:outline-none transition-colors"
      />
      {value ? (
        <button
          onClick={() => {
            onChange('');
            resolvedRef.current?.focus();
          }}
          className="absolute right-2 p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="absolute right-2 text-[10px] font-mono text-text-muted border border-border bg-surface-base px-1 py-0.2 rounded shadow-2xs pointer-events-none">
          /
        </span>
      )}
    </div>
  );
};
