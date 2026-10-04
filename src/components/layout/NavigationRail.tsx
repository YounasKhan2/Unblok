import React from 'react';
import {
  Layers,
  ShieldAlert,
  GitFork,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Hash,
  HelpCircle,
  RotateCcw,
  Bookmark,
  Calendar,
  Target,
  CalendarRange,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { Avatar } from '../ui/Avatar';

export const NavigationRail: React.FC = () => {
  const {
    teams,
    projects,
    issues,
    dependencies,
    currentUser,
    setCurrentUser,
    users,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    savedViews,
    activeSavedViewId,
    applySavedView,
    isNavCollapsed,
    setIsNavCollapsed,
    getIssueBlockerStatus,
    resetToDemoData,
  } = useProject();

  const { setIsHelpModalOpen, setIsCreateModalOpen } = useKeyboard();

  const totalBlockedCount = issues.filter(i => getIssueBlockerStatus(i.id).isBlocked).length;

  return (
    <nav
      className={`${
        isNavCollapsed ? 'w-12' : 'w-[220px]'
      } shrink-0 bg-[#fafaf9] border-r border-[#e5e3df] h-full flex flex-col justify-between select-none transition-all duration-150 z-20`}
      aria-label="Navigation Rail"
    >
      {/* 1. Header & Workspace Branding */}
      <div>
        <div className="h-12 flex items-center justify-between px-3 border-b border-[#e5e3df]">
          {!isNavCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-[4px] bg-[#5645d4] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                K
              </div>
              <span className="font-semibold text-xs text-[#1a1a1a] truncate">
                Nexus Engineering
              </span>
            </div>
          )}

          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="p-1 rounded text-[#787671] hover:text-[#1a1a1a] hover:bg-[#ede9e4] transition-colors"
            title={isNavCollapsed ? 'Expand sidebar ([)' : 'Collapse sidebar ([)'}
          >
            {isNavCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Core Views */}
        <div className="p-2 space-y-0.5 text-xs">
          {/* All Issues */}
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, blockerFilter: 'ALL', assigneeId: 'ALL', teamId: 'ALL' }));
              if (viewMode === 'GRAPH') setViewMode('LIST');
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filters.blockerFilter === 'ALL' && filters.assigneeId === 'ALL' && viewMode !== 'GRAPH'
                ? 'bg-[#ede9e4] font-medium text-[#1a1a1a]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="All Issues"
          >
            <Layers className="w-4 h-4 text-[#787671] shrink-0" />
            {!isNavCollapsed && <span>All Issues</span>}
          </button>

          {/* Blocked Issues (Primary PRD Wedge) */}
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, blockerFilter: 'BLOCKED_ONLY' }));
              if (viewMode === 'GRAPH') setViewMode('LIST');
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filters.blockerFilter === 'BLOCKED_ONLY'
                ? 'bg-[#ffe8d4] text-[#dd5b00] font-semibold'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Active Blockers"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#dd5b00] shrink-0" />
              {!isNavCollapsed && <span>Active Blockers</span>}
            </div>
            {!isNavCollapsed && totalBlockedCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#dd5b00] text-white">
                {totalBlockedCount}
              </span>
            )}
          </button>

          {/* My Triage */}
          <button
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                assigneeId: filters.assigneeId === currentUser.id ? 'ALL' : currentUser.id,
              }));
              if (viewMode === 'GRAPH') setViewMode('LIST');
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filters.assigneeId === currentUser.id
                ? 'bg-[#ede9e4] font-medium text-[#1a1a1a]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Assigned to Me"
          >
            <UserIcon className="w-4 h-4 text-[#787671] shrink-0" />
            {!isNavCollapsed && <span>My Assigned</span>}
          </button>

          {/* Cycles / Sprints (Phase B — Planning) */}
          <button
            onClick={() => setViewMode('CYCLES')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'CYCLES'
                ? 'bg-[#ede9e4] font-medium text-[#5645d4]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Delivery Cycles"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#5645d4] shrink-0" />
              {!isNavCollapsed && <span>Cycles</span>}
            </div>
            {!isNavCollapsed && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                24
              </span>
            )}
          </button>

          {/* Strategic Milestones (Phase B.2 — Objectives) */}
          <button
            onClick={() => setViewMode('MILESTONES')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'MILESTONES'
                ? 'bg-[#ede9e4] font-medium text-[#5645d4]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Strategic Milestones"
          >
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-[#5645d4] shrink-0" />
              {!isNavCollapsed && <span>Milestones</span>}
            </div>
            {!isNavCollapsed && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#5645d4]">
                3
              </span>
            )}
          </button>

          {/* Delivery Roadmap & Timeline (Phase B.3) */}
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'TIMELINE'
                ? 'bg-[#ede9e4] font-medium text-[#5645d4]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Roadmap & Timeline"
          >
            <CalendarRange className="w-4 h-4 text-[#5645d4] shrink-0" />
            {!isNavCollapsed && <span>Timeline</span>}
          </button>

          {/* Dependency Matrix & DAG */}
          <button
            onClick={() => setViewMode('GRAPH')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'GRAPH'
                ? 'bg-[#ede9e4] font-medium text-[#5645d4]'
                : 'text-[#37352f] hover:bg-[#ede9e4]/60'
            }`}
            title="Dependency Matrix"
          >
            <GitFork className="w-4 h-4 text-[#5645d4] shrink-0" />
            {!isNavCollapsed && <span>Dependency DAG</span>}
          </button>
        </div>

        {/* 2.5 Saved Views Section */}
        {!isNavCollapsed && (
          <div className="px-3 pt-3 pb-1 border-t border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider flex items-center justify-between">
            <span>Saved Views</span>
            <Bookmark className="w-3 h-3 text-[#a4a097]" />
          </div>
        )}

        <div className="px-2 space-y-0.5 text-xs">
          {savedViews.map(view => {
            const isSelected = activeSavedViewId === view.id;
            return (
              <button
                key={view.id}
                onClick={() => applySavedView(view)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer text-left truncate ${
                  isSelected
                    ? 'bg-[#5645d4]/10 text-[#5645d4] font-semibold'
                    : 'text-[#37352f] hover:bg-[#ede9e4]/60'
                }`}
                title={view.name}
              >
                <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#5645d4]' : 'text-[#787671]'}`} />
                {!isNavCollapsed && <span className="truncate">{view.name}</span>}
              </button>
            );
          })}
        </div>

        {/* 3. Teams & Projects Section */}
        {!isNavCollapsed && (
          <div className="px-3 pt-3 pb-1 border-t border-[#e5e3df] text-[11px] font-semibold text-[#787671] uppercase tracking-wider">
            Teams & Delivery
          </div>
        )}

        <div className="px-2 space-y-0.5 text-xs">
          {teams.map(team => {
            const isSelected = filters.teamId === team.id;
            const teamIssues = issues.filter(i => i.teamId === team.id);

            return (
              <button
                key={team.id}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    teamId: prev.teamId === team.id ? 'ALL' : team.id,
                  }));
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#ede9e4] font-medium text-[#1a1a1a]' : 'text-[#37352f] hover:bg-[#ede9e4]/60'
                }`}
                title={team.name}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  {!isNavCollapsed && <span className="truncate">{team.name}</span>}
                </div>
                {!isNavCollapsed && (
                  <span className="text-[10px] text-[#787671]">{teamIssues.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom User profile, Help & Reset */}
      <div className="p-2 border-t border-[#e5e3df] space-y-1">
        {/* Keyboard shortcut trigger */}
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#787671] hover:text-[#1a1a1a] hover:bg-[#ede9e4] rounded-[6px] transition-colors cursor-pointer"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Shortcuts (Press ?)</span>}
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={resetToDemoData}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#787671] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
          title="Reset to initial seed data"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          {!isNavCollapsed && <span>Reset Demo State</span>}
        </button>

        {/* Current user switch pill */}
        <div className="pt-1 border-t border-[#e5e3df]">
          <div className="flex items-center gap-2 p-1.5 rounded-[6px] hover:bg-[#ede9e4] cursor-pointer">
            <Avatar user={currentUser} size="sm" />
            {!isNavCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-semibold text-[#1a1a1a] truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#787671]">{currentUser.role}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
