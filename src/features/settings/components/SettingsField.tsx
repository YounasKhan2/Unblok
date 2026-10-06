import React from 'react';

interface SettingsFieldProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  horizontal?: boolean;
  required?: boolean;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({
  id,
  label,
  description,
  error,
  children,
  horizontal = false,
  required = false,
}) => {
  if (horizontal) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#e5e3df]/60 last:border-b-0">
        <div className="flex-1 max-w-lg">
          <label
            htmlFor={id}
            className="text-xs font-medium text-[#1a1a1a] flex items-center gap-1"
          >
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
          {description && (
            <p className="text-[11px] text-[#787671] mt-0.5 leading-relaxed">{description}</p>
          )}
          {error && <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-w-xl">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-[#1a1a1a]"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-[11px] text-[#787671] -mt-0.5 leading-relaxed">{description}</p>
      )}
      <div>{children}</div>
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
};
