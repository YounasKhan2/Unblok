import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Issue, User, Team } from '../../types';
import { PriorityIcon } from '../ui/PriorityIcon';
import { Avatar } from '../ui/Avatar';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  MoreHorizontal,
  ShieldAlert,
  Send,
  Calendar,
  Layers,
  Sparkles,
  Link2,
  Clock,
  Trash2,
  Share2,
  Download,
  CheckCircle2,
  Users,
} from 'lucide-react';

type GroupByMode = 'TEAM' | 'ASSIGNEE';

export const TimelineRoadmapView: React.FC = () => {
  const {
    issues,
    teams,
    users,
    cycles,
    activeCycle,
    getIssueBlockerStatus,
    selectedIssueId,
    setSelectedIssueId,
    setIsDrawerOpen,
    createIssue,
  } = useProject();

  // Navigation & View Mode
  const [groupBy, setGroupBy] = useState<GroupByMode>('TEAM');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string | 'ALL'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [publishedToast, setPublishedToast] = useState(false);

  // Date Range state: Current 7-day or 14-day schedule window
  // Keep the demo window aligned with the fixed NEXUS fixture week.
  const [windowStartDate, setWindowStartDate] = useState<Date>(() => new Date('2026-10-05T00:00:00.000Z'));
  const daysToShow = 7; // 7 days per view (matching the reference image's Mon - Sun layout)

  const todayStr = '2026-10-08'; // October 8, 2026

  // Generate the 7 days in the current window
  const scheduleDays = useMemo(() => {
    const daysArr: { dateStr: string; dayNum: number; dayOfWeek: string; monthName: string; isWeekend: boolean }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(windowStartDate.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayNum = d.getUTCDate();
      const dayOfWeek = weekdays[d.getUTCDay()];
      const monthName = months[d.getUTCMonth()];
      const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

      daysArr.push({ dateStr, dayNum, dayOfWeek, monthName, isWeekend });
    }
    return daysArr;
  }, [windowStartDate, daysToShow]);

  // Window title range string, e.g. "28 Sep - 04 Oct"
  const windowRangeLabel = useMemo(() => {
    if (scheduleDays.length === 0) return '';
    const first = scheduleDays[0];
    const last = scheduleDays[scheduleDays.length - 1];
    return `${first.dayNum} ${first.monthName} - ${last.dayNum} ${last.monthName} 2026`;
  }, [scheduleDays]);

  const handlePrevWeek = () => {
    setWindowStartDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const handleNextWeek = () => {
    setWindowStartDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleJumpToToday = () => {
    setWindowStartDate(new Date('2026-10-05T00:00:00.000Z'));
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Assignee role tags styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Staff Lead', bg: 'bg-[#ede9fe]', text: 'text-[#6d28d9]' };
      case 'MEMBER':
        return { label: 'Senior Engineer', bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' };
      default:
        return { label: 'Engineer', bg: 'bg-[#f3f4f6]', text: 'text-[#4b5563]' };
    }
  };

  // Filtered assignees for left roster
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(assigneeSearch.toLowerCase())
    );
  }, [users, assigneeSearch]);

  // Assignee metrics
  const getUserMetrics = (userId: string) => {
    const userIssues = issues.filter(i => i.assigneeId === userId);
    let blockedCount = 0;
    for (const iss of userIssues) {
      const blk = getIssueBlockerStatus(iss.id);
      if (blk.activeCount > 0) blockedCount++;
    }
    return {
      total: userIssues.length,
      blocked: blockedCount,
      done: userIssues.filter(i => i.state === 'DONE').length,
    };
  };

  // Helper to determine if an issue should appear in a day cell
  const isIssueActiveOnDate = (issue: Issue, dateStr: string) => {
    const start = issue.startDate || issue.createdAt.substring(0, 10);
    const due = issue.dueDate || start;
    return dateStr >= start && dateStr <= due;
  };

  // Swimlanes depending on GroupBy mode
  const swimlanes = useMemo(() => {
    if (groupBy === 'TEAM') {
      return teams.map(team => {
        let teamIssues = issues.filter(i => i.teamId === team.id);
        if (selectedAssigneeFilter !== 'ALL') {
          teamIssues = teamIssues.filter(i => i.assigneeId === selectedAssigneeFilter);
        }
        return {
          id: team.id,
          title: team.name,
          color: team.color,
          badge: `${team.key} Workstream`,
          issues: teamIssues,
        };
      });
    } else {
      // Group by ASSIGNEE
      const matchingUsers = selectedAssigneeFilter === 'ALL'
        ? users
        : users.filter(u => u.id === selectedAssigneeFilter);

      return matchingUsers.map(user => {
        const userIssues = issues.filter(i => i.assigneeId === user.id);
        return {
          id: user.id,
          title: user.name,
          color: '#5645d4',
          badge: user.email,
          user,
          issues: userIssues,
        };
      });
    }
  }, [groupBy, teams, users, issues, selectedAssigneeFilter]);

  // Fast Quick Add task in a day cell
  const handleQuickAddTask = (swimlaneId: string, dateStr: string) => {
    const teamId = groupBy === 'TEAM' ? swimlaneId : 'team_eng';
    const assigneeId = groupBy === 'ASSIGNEE' ? swimlaneId : undefined;
    const team = teams.find(t => t.id === teamId);

    const title = prompt(`Quick create task for ${dateStr}:`, 'New planned task');
    if (!title || !title.trim()) return;

    createIssue({
      title: title.trim(),
      description: `Scheduled for ${dateStr} during delivery sprint.`,
      projectId: teamId === 'team_inf' ? 'proj_inf_ops' : teamId === 'team_web' ? 'proj_web_ui' : 'proj_eng_auth',
      priority: 'MEDIUM',
      assigneeId,
    });
  };

  const handlePublishSprint = () => {
    setPublishedToast(true);
    setTimeout(() => setPublishedToast(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbfbfa] overflow-hidden select-none">
      {/* 1. Top Schedule Control Bar (Matching reference design) */}
      <div className="px-5 py-2.5 bg-white border-b border-[#e5e3df] shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Left: Scope / Workstream / Date range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e3df] bg-[#fafaf9] text-xs font-semibold text-[#1a1a1a]">
            <span className="w-2 h-2 rounded-full bg-[#5645d4]" />
            <span>Workspace: Unblok Core</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#787671]" />
          </div>

          {/* Date Range Navigator: < Range > */}
          <div className="flex items-center gap-1 bg-[#f5f4f2] p-1 rounded-lg border border-[#e5e3df]">
            <button
              onClick={handlePrevWeek}
              className="p-1 hover:bg-white rounded text-[#5645d4] transition-colors cursor-pointer"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#5645d4] px-2 min-w-[150px] text-center">
              {windowRangeLabel}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1 hover:bg-white rounded text-[#5645d4] transition-colors cursor-pointer"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleJumpToToday}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#e5e3df] hover:bg-[#f6f5f4] text-[#37352f] transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-[#5645d4]" />
            <span>Today</span>
          </button>

          {/* View By: Team vs Assignee Dropdown */}
          <div className="flex items-center gap-1 bg-[#ede9fe]/60 border border-purple-200 text-[#5645d4] px-2.5 py-1.5 rounded-lg text-xs font-semibold">
            <span>View by:</span>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupByMode)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-[#5645d4]"
            >
              <option value="TEAM">Team Workstream</option>
              <option value="ASSIGNEE">Assignee Workload</option>
            </select>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e3df] bg-white hover:bg-[#f6f5f4] text-xs font-medium text-[#37352f] transition-colors cursor-pointer"
            title="Rebalance workload"
          >
            <Share2 className="w-3.5 h-3.5 text-[#787671]" />
            <span className="hidden sm:inline">Rebalance</span>
          </button>

          <button
            onClick={() => {
              if (selectedAssigneeFilter !== 'ALL') {
                setSelectedAssigneeFilter('ALL');
              } else {
                alert('No scheduled filters to clear.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e3df] bg-white hover:bg-[#f6f5f4] text-xs font-medium text-[#787671] transition-colors cursor-pointer"
            title="Reset filters"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => {
              const json = JSON.stringify(issues, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `kite-schedule-${windowRangeLabel.replace(/\s+/g, '-')}.json`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e3df] bg-white hover:bg-[#f6f5f4] text-xs font-medium text-[#37352f] transition-colors cursor-pointer"
            title="Export schedule"
          >
            <Download className="w-3.5 h-3.5 text-[#787671]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Publish / Sync Sprint Button (Purple gradient matching reference) */}
          <button
            onClick={handlePublishSprint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#5645d4] hover:from-[#6d28d9] hover:to-[#4838bd] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Sprint</span>
          </button>
        </div>
      </div>

      {/* Published Toast Notice */}
      {publishedToast && (
        <div className="bg-[#10b981] text-white text-xs font-semibold px-4 py-2 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sprint schedule published! All team members and workstreams have been synchronized.</span>
          </div>
          <button onClick={() => setPublishedToast(false)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. Main Content Split: Left Assignee Roster + Right Calendar Columns */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Left Pinned Sidebar: Assignees Roster (Inspired by reference image) */}
        <div className="w-[260px] md:w-[280px] shrink-0 bg-white border-r border-[#e5e3df] flex flex-col z-20 shadow-xs">
          {/* Top Search & Filter Bar */}
          <div className="p-3 border-b border-[#e5e3df] flex items-center gap-2 bg-white">
            <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#fafaf9] border border-[#e5e3df] text-xs">
              <Search className="w-3.5 h-3.5 text-[#a4a097] shrink-0" />
              <input
                type="text"
                value={assigneeSearch}
                onChange={e => setAssigneeSearch(e.target.value)}
                placeholder="Search assignees..."
                className="w-full bg-transparent text-[#1a1a1a] placeholder:text-[#a4a097] focus:outline-none text-xs"
              />
            </div>
            <button
              onClick={() => setSelectedAssigneeFilter('ALL')}
              className={`p-1.5 rounded-lg border text-[#787671] hover:bg-[#fafaf9] transition-colors cursor-pointer ${
                selectedAssigneeFilter !== 'ALL' ? 'border-[#5645d4] text-[#5645d4] bg-purple-50' : 'border-[#e5e3df]'
              }`}
              title="Filter assignees"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Assignees Roster List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredUsers.map(user => {
              const metrics = getUserMetrics(user.id);
              const roleBadge = getRoleBadge(user.role);
              const isSelected = selectedAssigneeFilter === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedAssigneeFilter(prev => prev === user.id ? 'ALL' : user.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#5645d4] bg-purple-50/50 shadow-xs ring-1 ring-purple-300'
                      : 'border-[#e5e3df] bg-white hover:border-[#c8c4be] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar user={user} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#1a1a1a] truncate">
                          {user.name}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold ${roleBadge.bg} ${roleBadge.text}`}
                        >
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedAssigneeFilter(user.id);
                      }}
                      className="p-1 text-[#787671] hover:text-[#1a1a1a] rounded hover:bg-[#f5f4f2]"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metrics icons strip (matching reference design icons) */}
                  <div className="flex items-center gap-2.5 pt-1.5 mt-1 border-t border-[#f0eee9] text-[11px] text-[#787671]">
                    <div className="flex items-center gap-1 font-semibold text-[#1a1a1a]">
                      <span>{metrics.total}</span>
                      <Calendar className="w-3 h-3 text-[#a4a097]" />
                    </div>

                    {metrics.blocked > 0 ? (
                      <div className="flex items-center gap-0.5 text-[#dd5b00] font-bold" title={`${metrics.blocked} blocked tasks`}>
                        <ShieldAlert className="w-3 h-3" />
                        <span>{metrics.blocked}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 text-[#1aae39]" title="All tasks unblocked">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>0</span>
                      </div>
                    )}

                    <div className="text-[10px] text-[#a4a097] ml-auto">
                      {metrics.done} done
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Add Assignee CTA */}
          <div className="p-3 border-t border-[#e5e3df] bg-[#fafaf9]">
            <button
              onClick={() => alert('Invite additional teammates in Workspace Settings.')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#e5e3df] bg-white hover:bg-[#f6f5f4] text-xs font-semibold text-[#37352f] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#5645d4]" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Right Calendar Columns: 7 Days Grid with Collapsible Swimlanes */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-[#f8f7f5] flex flex-col">
          {/* Day Columns Header */}
          <div className="sticky top-0 z-30 flex bg-white border-b border-[#e5e3df] shadow-2xs min-w-[770px]">
            {scheduleDays.map(day => {
              const isToday = day.dateStr === todayStr;
              return (
                <div
                  key={day.dateStr}
                  className={`flex-1 min-w-[110px] py-2.5 px-3 border-r border-[#e5e3df] flex items-center justify-between ${
                    isToday ? 'bg-purple-50/60 font-bold' : day.isWeekend ? 'bg-[#fcfbfa]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-sm font-bold ${isToday ? 'text-[#5645d4]' : 'text-[#1a1a1a]'}`}>
                      {day.dayNum}
                    </span>
                    <span className="text-[11px] font-semibold text-[#787671]">
                      {day.monthName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#787671]">{day.dayOfWeek}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5645d4]" title="Today" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Swimlanes Body */}
          <div className="flex-1 divide-y divide-[#e5e3df] min-w-[770px]">
            {swimlanes.map(swimlane => {
              const isCollapsed = collapsedGroups[swimlane.id];

              return (
                <div key={swimlane.id} className="bg-white">
                  {/* Swimlane Section Header Banner (matching reference style) */}
                  <div
                    onClick={() => toggleGroupCollapse(swimlane.id)}
                    className="px-4 py-2 bg-[#f6f5f4] hover:bg-[#edeae5] border-b border-[#e5e3df] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <button className="text-[#787671] hover:text-[#1a1a1a]">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: swimlane.color }}
                      />
                      <span className="text-xs font-bold text-[#1a1a1a]">
                        {swimlane.title}
                      </span>
                      <span className="text-[11px] text-[#787671]">
                        ({swimlane.issues.length} {swimlane.issues.length === 1 ? 'task' : 'tasks'})
                      </span>
                    </div>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#e5e3df] text-[#787671]">
                      {swimlane.badge}
                    </span>
                  </div>

                  {/* Swimlane 7-Day Grid Cells */}
                  {!isCollapsed && (
                    <div className="flex min-h-[140px] divide-x divide-[#e5e3df] bg-[#fafaf9]">
                      {scheduleDays.map(day => {
                        const dayIssues = swimlane.issues.filter(issue =>
                          isIssueActiveOnDate(issue, day.dateStr)
                        );
                        const isToday = day.dateStr === todayStr;

                        return (
                          <div
                            key={day.dateStr}
                            className={`flex-1 min-w-[110px] p-2 flex flex-col gap-2 transition-colors ${
                              isToday ? 'bg-purple-50/20' : day.isWeekend ? 'bg-[#fdfcfb]' : 'bg-transparent'
                            }`}
                          >
                            {/* Render Task Cards in this Day Slot */}
                            {dayIssues.map(issue => {
                              const blocker = getIssueBlockerStatus(issue.id);
                              const isSelected = issue.id === selectedIssueId;
                              const assignee = users.find(u => u.id === issue.assigneeId);
                              const isDone = issue.state === 'DONE';
                              const isBlocked = blocker.activeCount > 0;

                              return (
                                <div
                                  key={issue.id}
                                  onClick={() => {
                                    setSelectedIssueId(issue.id);
                                    setIsDrawerOpen(true);
                                  }}
                                  className={`p-2.5 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-[#5645d4] ${
                                    isSelected
                                      ? 'border-[#5645d4] ring-2 ring-purple-400 ring-offset-1'
                                      : isBlocked
                                      ? 'border-amber-300 bg-amber-50/20'
                                      : isDone
                                      ? 'border-emerald-200 bg-emerald-50/15'
                                      : 'border-[#e5e3df]'
                                  }`}
                                >
                                  {/* Top Row: Title & Context Menu */}
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="min-w-0">
                                      <div className="font-mono text-[10px] font-bold text-[#5645d4]">
                                        {issue.key}
                                      </div>
                                      <div className="text-xs font-semibold text-[#1a1a1a] line-clamp-2 leading-tight">
                                        {issue.title}
                                      </div>
                                    </div>
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedIssueId(issue.id);
                                        setIsDrawerOpen(true);
                                      }}
                                      className="text-[#a4a097] hover:text-[#1a1a1a] p-0.5"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Subtitle: Time / Span & Role Tag */}
                                  <div className="flex items-center gap-1.5 my-1.5 flex-wrap">
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                        isDone
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isBlocked
                                          ? 'bg-[#ffe8d4] text-[#dd5b00]'
                                          : 'bg-blue-100 text-[#0075de]'
                                      }`}
                                    >
                                      {isBlocked ? 'BLOCKED' : issue.state}
                                    </span>

                                    {assignee && (
                                      <span className="text-[10px] text-[#787671] truncate max-w-[80px]">
                                        {assignee.name.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom Row: Metrics Strip (matching reference image) */}
                                  <div className="flex items-center justify-between pt-1 border-t border-[#f0eee9] text-[10px] text-[#787671]">
                                    <div className="flex items-center gap-2">
                                      <PriorityIcon priority={issue.priority} size="sm" />

                                      {blocker.activeCount > 0 && (
                                        <div className="flex items-center gap-0.5 text-[#dd5b00] font-bold">
                                          <ShieldAlert className="w-3 h-3" />
                                          <span>{blocker.activeCount}</span>
                                        </div>
                                      )}
                                    </div>

                                    <Avatar user={assignee} size="xs" />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Quick Add Button in Cell (+) */}
                            <button
                              onClick={() => handleQuickAddTask(swimlane.id, day.dateStr)}
                              className="mt-auto py-1 px-1.5 rounded-lg border border-dashed border-[#e5e3df] hover:border-[#5645d4] hover:bg-white text-[#a4a097] hover:text-[#5645d4] flex items-center justify-center transition-colors cursor-pointer group"
                              title={`Schedule task on ${day.dateStr}`}
                            >
                              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Add Workstream / Room Button */}
            <div className="p-3 bg-[#fafaf9]">
              <button
                onClick={() => alert('New workstreams are configured via Project / Team settings.')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#d2cfc9] hover:border-[#5645d4] hover:bg-white text-xs font-semibold text-[#5645d4] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add new workstream</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
