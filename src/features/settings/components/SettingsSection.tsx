import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  action,
  children,
  variant = 'default',
}) => {
  const isDanger = variant === 'danger';

  return (
    <section
      className={`rounded-lg border overflow-hidden ${
        isDanger
          ? 'border-red-200 bg-white'
          : 'border-[#e5e3df] bg-white'
      }`}
    >
      <div
        className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isDanger
            ? 'bg-red-50/50 border-red-200 text-red-900'
            : 'bg-[#fafaf9] border-[#e5e3df]'
        }`}
      >
        <div>
          <h2
            className={`text-sm font-semibold tracking-tight ${
              isDanger ? 'text-red-700' : 'text-[#1a1a1a]'
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="text-xs text-[#787671] mt-0.5 max-w-2xl">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
};
