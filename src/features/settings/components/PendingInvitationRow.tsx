import React, { useState } from 'react';
import { PendingInvitation } from '../types';
import { Team } from '../../../types';
import { RoleBadge } from './RoleBadge';
import { Button } from '../../../components/ui/Button';
import { RotateCcw, XCircle, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

import { formatUserDate } from '../../../components/ui/formatDate';

interface PendingInvitationRowProps {
  invitation: PendingInvitation;
  teams: Team[];
}

export const PendingInvitationRow: React.FC<PendingInvitationRowProps> = ({
  invitation,
  teams,
}) => {
  const { resendInvitation, revokeInvitation } = useSettings();
  const [resendSuccess, setResendSuccess] = useState(false);

  const assignedTeams = teams.filter(t => invitation.teamIds.includes(t.id));
  const isRevoked = invitation.status === 'REVOKED';

  const handleResend = () => {
    resendInvitation(invitation.id);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 2500);
  };

  const handleRevoke = () => {
    revokeInvitation(invitation.id);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
        isRevoked
          ? 'bg-surface-subtle/50 border-border opacity-60'
          : 'bg-surface-base border-border hover:border-border-strong'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary truncate">
            {invitation.email}
          </span>
          <RoleBadge role={invitation.role} size="xs" />
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
              isRevoked
                ? 'bg-danger/10 text-danger border-danger/30'
                : 'bg-warning/10 text-warning border-warning/30'
            }`}
          >
            {invitation.status}
          </span>
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          Invited on {formatUserDate(invitation.invitedAt)}
          {invitation.resentAt && ` • Resent on ${formatUserDate(invitation.resentAt)}`}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end flex-wrap">
        {/* Teams Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          {assignedTeams.length > 0 ? (
            assignedTeams.map(t => (
              <span
                key={t.id}
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary border border-border"
                title={t.name}
              >
                {t.key}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-text-muted italic">No team</span>
          )}
        </div>

        {/* Actions */}
        {!isRevoked && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={
                resendSuccess ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                )
              }
              onClick={handleResend}
              title="Resend prototype invitation"
            >
              {resendSuccess ? 'Resent' : 'Resend'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle className="w-3.5 h-3.5 text-danger" />}
              onClick={handleRevoke}
              title="Revoke invitation"
            >
              Revoke
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
