import React from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsNavigation } from './SettingsNavigation';
import { useSettings } from '../context/SettingsContext';
import { RoleBadge } from './RoleBadge';

export const SettingsLayout: React.FC = () => {
  const { currentUser } = useSettings();

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Settings
              </h1>
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Manage workspace configuration, members, integrations, and personal preferences.
            </p>
          </div>
        </div>

        {/* 2-Column Shell on Desktop / 1-Column on Mobile */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <SettingsNavigation />
          <main className="flex-1 min-w-0 w-full space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
