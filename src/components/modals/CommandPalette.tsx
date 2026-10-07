import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useKeyboard } from '../../context/KeyboardContext';
import { useDrawerRoute } from '../../app/router/useDrawerRoute';
import {
  Search,
  Plus,
  Layers,
  Kanban,
  GitFork,
  ShieldAlert,
  CheckCircle2,
  Users,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Calendar,
  Target,
  CalendarRange,
  FolderKanban,
} from 'lucide-react';
import { PriorityIcon } from '../ui/PriorityIcon';
import { StatePill } from '../ui/StatePill';

interface CommandItem {
  id: string;
  title: string;
  category: 'ISSUES' | 'VIEWS' | 'FILTERS' | 'TEAMS' | 'PROJECTS' | 'ACTIONS';
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  issueKey?: string;
  issueState?: any;
}

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useDrawerRoute();
  const {
    issues,
    teams,
    projects,
    setSelectedIssueId,
    setIsDrawerOpen,
    setViewMode,
    setFilters,
    resetToDemoData,
  } = useProject();

  const { setIsCreateModalOpen } = useKeyboard();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command catalogue
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Actions
      {
        id: 'cmd_create_issue',
        title: 'Create new issue',
        category: 'ACTIONS',
        icon: <Plus className="w-4 h-4 text-[#5645d4]" />,
        shortcut: 'C',
        onSelect: () => {
          setIsOpen(false);
          setIsCreateModalOpen(true);
        },
      },
      {
        id: 'cmd_reset_demo',
        title: 'Reset demo data to initial state',
        category: 'ACTIONS',
        icon: <RotateCcw className="w-4 h-4 text-red-500" />,
        onSelect: () => {
          setIsOpen(false);
          resetToDemoData();
        },
      },
      // Views
      {
        id: 'cmd_view_list',
        title: 'Switch to High-Density List View',
        category: 'VIEWS',
        icon: <Layers className="w-4 h-4 text-[#0075de]" />,
        shortcut: 'V',
        onSelect: () => {
          setIsOpen(false);
          setViewMode('LIST');
        },
      },
      {
        id: 'cmd_view_board',
        title: 'Switch to Kanban Board View',
        category: 'VIEWS',
        icon: <Kanban className="w-4 h-4 text-[#dd5b00]" />,
        shortcut: 'V',
        onSelect: () => {
          setIsOpen(false);
          setViewMode('BOARD');
        },
      },
      {
        id: 'cmd_view_matrix',
        title: 'Switch to Cross-Team Dependency DAG Matrix',
        category: 'VIEWS',
        icon: <GitFork className="w-4 h-4 text-[#5645d4]" />,
        shortcut: 'V',
        onSelect: () => {
          setIsOpen(false);
          setViewMode('GRAPH');
        },
      },
      {
        id: 'cmd_view_cycles',
        title: 'Switch to Delivery Cycles & Sprints',
        category: 'VIEWS',
        icon: <Calendar className="w-4 h-4 text-[#5645d4]" />,
        onSelect: () => {
          setIsOpen(false);
          setViewMode('CYCLES');
        },
      },
      {
        id: 'cmd_view_milestones',
        title: 'Switch to Strategic Milestones',
        category: 'VIEWS',
        icon: <Target className="w-4 h-4 text-[#5645d4]" />,
        onSelect: () => {
          setIsOpen(false);
          setViewMode('MILESTONES');
        },
      },
      {
        id: 'cmd_view_timeline',
        title: 'Switch to Delivery Roadmap & Timeline',
        category: 'VIEWS',
        icon: <CalendarRange className="w-4 h-4 text-[#5645d4]" />,
        onSelect: () => {
          setIsOpen(false);
          setViewMode('TIMELINE');
        },
      },
      // Filters
      {
        id: 'cmd_filter_blocked',
        title: 'Show Actively Blocked Issues Only',
        category: 'FILTERS',
        icon: <ShieldAlert className="w-4 h-4 text-[#dd5b00]" />,
        onSelect: () => {
          setIsOpen(false);
          setFilters(prev => ({ ...prev, blockerFilter: 'BLOCKED_ONLY' }));
        },
      },
      {
        id: 'cmd_filter_unblocked',
        title: 'Show Ready (Unblocked) Issues Only',
        category: 'FILTERS',
        icon: <CheckCircle2 className="w-4 h-4 text-[#1aae39]" />,
        onSelect: () => {
          setIsOpen(false);
          setFilters(prev => ({ ...prev, blockerFilter: 'UNBLOCKED_ONLY' }));
        },
      },
      {
        id: 'cmd_filter_urgent',
        title: 'Filter: Urgent Priority Only',
        category: 'FILTERS',
        icon: <PriorityIcon priority="URGENT" size="sm" />,
        onSelect: () => {
          setIsOpen(false);
          setFilters(prev => ({ ...prev, priority: 'URGENT' }));
        },
      },
    ];

    // Navigation: Projects
    list.push({
      id: 'cmd_nav_projects_directory',
      title: 'Go to Projects Directory',
      category: 'PROJECTS',
      icon: <FolderKanban className="w-4 h-4 text-[#5645d4]" />,
      shortcut: 'G P',
      onSelect: () => {
        setIsOpen(false);
        navigate('/projects');
      },
    });

    for (const project of projects) {
      list.push({
        id: `cmd_proj_${project.id}`,
        title: `Open project: ${project.name} (${project.key})`,
        category: 'PROJECTS',
        icon: <FolderKanban className="w-4 h-4 text-[#5645d4]" />,
        onSelect: () => {
          setIsOpen(false);
          navigate(`/projects/${project.key}/issues`);
        },
      });
    }

    // Teams
    for (const team of teams) {
      list.push({
        id: `cmd_team_${team.id}`,
        title: `Filter team: ${team.name} (${team.key})`,
        category: 'TEAMS',
        icon: <Users className="w-4 h-4 text-[#5645d4]" />,
        onSelect: () => {
          setIsOpen(false);
          setFilters(prev => ({ ...prev, teamId: team.id }));
        },
      });
    }

    // Issues
    for (const issue of issues) {
      list.push({
        id: `cmd_issue_${issue.id}`,
        title: issue.title,
        category: 'ISSUES',
        issueKey: issue.key,
        issueState: issue.state,
        icon: <PriorityIcon priority={issue.priority} size="sm" />,
        onSelect: () => {
          setIsOpen(false);
          setSelectedIssueId(issue.id);
          openDrawer(issue.key);
        },
      });
    }

    return list;
  }, [issues, teams, projects, navigate, openDrawer, setViewMode, setFilters, setIsCreateModalOpen, resetToDemoData, setSelectedIssueId]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands.slice(0, 14);
    }
    const q = query.toLowerCase().trim();
    return allCommands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchKey = cmd.issueKey?.toLowerCase().includes(q);
      const matchCat = cmd.category.toLowerCase().includes(q);
      return matchTitle || matchKey || matchCat;
    });
  }, [allCommands, query]);

  // Keyboard navigation within command list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) {
        current.onSelect();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a1530]/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div
        className="relative z-10 w-full max-w-xl bg-surface-base rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[480px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-surface-subtle">
          <Search className="w-4 h-4 text-text-muted mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, issue key (ENG-1), or filter... (Press Esc to close)"
            className="w-full text-sm bg-transparent border-0 focus:outline-none text-text-primary placeholder:text-text-muted"
          />
          <kbd className="font-mono text-[10px] text-text-muted border border-border bg-surface-base px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Command Results */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/40">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No commands or issues matching "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent-subtle text-text-primary' : 'hover:bg-surface-muted text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span className="shrink-0">{cmd.icon}</span>

                    {cmd.issueKey && (
                      <span className="font-mono font-bold text-accent">
                        {cmd.issueKey}
                      </span>
                    )}

                    <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
                      {cmd.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.issueState && (
                      <StatePill state={cmd.issueState} size="sm" showLabel={false} />
                    )}
                    {cmd.shortcut && (
                      <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-text-muted border border-border">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                      {cmd.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-border bg-surface-subtle flex items-center justify-between text-[11px] text-text-muted">
          <span>
            Use <kbd className="font-mono px-1 border border-border rounded bg-surface-base">↑</kbd> <kbd className="font-mono px-1 border border-border rounded bg-surface-base">↓</kbd> to navigate, <kbd className="font-mono px-1 border border-border rounded bg-surface-base">Enter</kbd> to select
          </span>
          <span className="font-mono">Cmd + K</span>
        </div>
      </div>
    </div>
  );
};
