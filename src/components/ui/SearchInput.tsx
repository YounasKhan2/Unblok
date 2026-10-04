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
      <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#787671] pointer-events-none" />
      <input
        ref={resolvedRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-8 pr-12 text-xs bg-[#f6f5f4] hover:bg-[#ede9e4]/70 focus:bg-white text-[#1a1a1a] placeholder:text-[#a4a097] border border-[#e5e3df] focus:border-[#5645d4] rounded-[6px] focus:outline-none transition-colors"
      />
      {value ? (
        <button
          onClick={() => {
            onChange('');
            resolvedRef.current?.focus();
          }}
          className="absolute right-2 p-0.5 text-[#a4a097] hover:text-[#37352f] rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="absolute right-2 text-[10px] font-mono text-[#a4a097] border border-[#e5e3df] bg-white px-1 py-0.2 rounded shadow-2xs pointer-events-none">
          /
        </span>
      )}
    </div>
  );
};
