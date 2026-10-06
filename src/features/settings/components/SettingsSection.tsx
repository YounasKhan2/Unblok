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
          ? 'border-danger/30 bg-surface-base'
          : 'border-border bg-surface-base'
      }`}
    >
      <div
        className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isDanger
            ? 'bg-danger/10 border-danger/30 text-danger'
            : 'bg-surface-subtle border-border'
        }`}
      >
        <div>
          <h2
            className={`text-sm font-semibold tracking-tight ${
              isDanger ? 'text-danger' : 'text-text-primary'
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="text-xs text-text-muted mt-0.5 max-w-2xl">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
};
