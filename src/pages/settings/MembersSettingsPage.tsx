import React, { useState, useMemo } from 'react';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { useProject } from '../../context/ProjectContext';
import { SettingsSection } from '../../features/settings/components/SettingsSection';
import { MemberRow } from '../../features/settings/components/MemberRow';
import { PendingInvitationRow } from '../../features/settings/components/PendingInvitationRow';
import { InviteMemberModal } from '../../features/settings/components/InviteMemberModal';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { UserPlus, Shield, Users, Eye } from 'lucide-react';
import { UserRole } from '../../types';

export const MembersSettingsPage: React.FC = () => {
  const { invitations } = useSettings();
  const { users, teams } = useProject();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');

  // Filtered active members supporting multi-team membership
  const filteredMembers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesTeam =
        teamFilter === 'ALL' ||
        (user.teamIds || (user.teamId ? [user.teamId] : [])).includes(teamFilter);

      return matchesSearch && matchesRole && matchesTeam;
    });
  }, [users, searchQuery, roleFilter, teamFilter]);

  const activeInvitations = invitations.filter(inv => inv.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            Members & Permissions
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage workspace roster, member roles, multi-team assignments, and pending invitations.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus className="w-3.5 h-3.5" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite Member
        </Button>
      </div>

      {/* 1. Active Members Section */}
      <SettingsSection
        title={`Active Members (${users.length})`}
        description="Workspace participants with active authentication access."
      >
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pb-2">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter by name or email..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as 'ALL' | UserRole)}
              className="px-2.5 py-1 text-xs border border-border rounded-md bg-surface-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MEMBER">MEMBER</option>
              <option value="OBSERVER">OBSERVER</option>
            </select>

            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-border rounded-md bg-surface-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Filter by team"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.key})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Member Roster List */}
        <div className="space-y-2">
          {filteredMembers.length > 0 ? (
            filteredMembers.map(member => (
              <MemberRow key={member.id} user={member} teams={teams} />
            ))
          ) : (
            <div className="text-center py-6 text-xs text-text-muted bg-surface-subtle rounded-lg border border-border">
              No members match the current filter criteria.
            </div>
          )}
        </div>
      </SettingsSection>

      {/* 2. Pending Invitations Section */}
      <SettingsSection
        title={`Pending Invitations (${activeInvitations.length})`}
        description="Sent invites awaiting acceptance. Prototype mock state only."
      >
        <div className="space-y-2">
          {invitations.length > 0 ? (
            invitations.map(inv => (
              <PendingInvitationRow key={inv.id} invitation={inv} teams={teams} />
            ))
          ) : (
            <div className="text-center py-6 text-xs text-text-muted bg-surface-subtle rounded-lg border border-border">
              No active or historical invitations.
            </div>
          )}
        </div>
      </SettingsSection>

      {/* 3. Role Definitions */}
      <SettingsSection
        title="Role Definitions"
        description="Overview of frozen workspace authorization capabilities."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-accent/20 bg-accent/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
              <Shield className="w-4 h-4" />
              <span>ADMIN</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Full workspace administration, member invitations, team management, integrations, plus normal execution capabilities. Workspace must always retain at least one ADMIN.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
              <Users className="w-4 h-4 text-text-muted" />
              <span>MEMBER</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Normal execution and engineering collaboration: creating issues, starting cycles, updating boards, managing blockers. No workspace administration access.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
              <Eye className="w-4 h-4" />
              <span>OBSERVER</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Read-only product participation across planning and issue streams, with personal Inbox notifications and display preference control.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        teams={teams}
      />
    </div>
  );
};
