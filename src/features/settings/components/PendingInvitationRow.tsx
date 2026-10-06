import React, { useState } from 'react';
import { PendingInvitation } from '../types';
import { Team } from '../../../types';
import { RoleBadge } from './RoleBadge';
import { Button } from '../../../components/ui/Button';
import { RotateCcw, XCircle, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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
          ? 'bg-[#f6f5f4]/50 border-[#e5e3df] opacity-60'
          : 'bg-white border-[#e5e3df] hover:border-[#c8c4be]'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1a1a1a] truncate">
            {invitation.email}
          </span>
          <RoleBadge role={invitation.role} size="xs" />
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
              isRevoked
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {invitation.status}
          </span>
        </div>
        <div className="text-[11px] text-[#787671] mt-0.5">
          Invited on {invitation.invitedAt}
          {invitation.resentAt && ` • Resent on ${invitation.resentAt}`}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end flex-wrap">
        {/* Teams Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          {assignedTeams.length > 0 ? (
            assignedTeams.map(t => (
              <span
                key={t.id}
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#f6f5f4] text-[#52504b] border border-[#e5e3df]"
                title={t.name}
              >
                {t.key}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[#a4a097] italic">No team</span>
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
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-[#787671]" />
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
              icon={<XCircle className="w-3.5 h-3.5 text-red-600" />}
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
