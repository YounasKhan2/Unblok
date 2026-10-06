import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Users, Users2, Plug, SlidersHorizontal } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export const SettingsNavigation: React.FC = () => {
  const { isAdmin } = useSettings();

  const adminNavItems: NavItem[] = [
    { to: '/settings/workspace', label: 'Workspace', icon: Building2, adminOnly: true },
    { to: '/settings/members', label: 'Members', icon: Users, adminOnly: true },
    { to: '/settings/teams', label: 'Teams', icon: Users2, adminOnly: true },
    { to: '/settings/integrations', label: 'Integrations', icon: Plug, adminOnly: true },
  ];

  const personalNavItems: NavItem[] = [
    { to: '/settings/preferences', label: 'Preferences', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Desktop Vertical Navigation (~190px - 210px) */}
      <nav
        aria-label="Settings navigation"
        className="hidden md:flex flex-col w-[200px] shrink-0 space-y-4"
      >
        {isAdmin && (
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
              Workspace
            </div>
            <div className="space-y-0.5">
              {adminNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                        isActive
                          ? 'bg-[#ede9e4] font-semibold text-[#1a1a1a]'
                          : 'text-[#52504b] hover:bg-[#ede9e4]/60 hover:text-[#1a1a1a]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 text-[#787671] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold text-[#787671] uppercase tracking-wider">
            Personal
          </div>
          <div className="space-y-0.5">
            {personalNavItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                      isActive
                        ? 'bg-[#ede9e4] font-semibold text-[#1a1a1a]'
                        : 'text-[#52504b] hover:bg-[#ede9e4]/60 hover:text-[#1a1a1a]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-[#787671] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Horizontal Navigation Tabs */}
      <nav
        aria-label="Settings mobile navigation"
        className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 border-b border-[#e5e3df] mb-4 text-xs shrink-0"
      >
        {isAdmin &&
          adminNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#1a1a1a] text-white font-medium'
                      : 'bg-[#f6f5f4] text-[#52504b] hover:bg-[#ede9e4]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        {personalNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white font-medium'
                    : 'bg-[#f6f5f4] text-[#52504b] hover:bg-[#ede9e4]'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
