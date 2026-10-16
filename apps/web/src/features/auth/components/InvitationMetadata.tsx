import {Building2,Mail,Shield,Users} from 'lucide-react';
export function InvitationMetadata({workspaceName,email,role,teamName}:{workspaceName?:string;email?:string;role:string;teamName?:string}){return <>
        {/* Invitation Metadata Card */}
        <div className="p-4 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>Workspace</span>
            </div>
            <span className="font-semibold text-[var(--color-pub-text-primary)]">
              {workspaceName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>Invited Email</span>
            </div>
            <span className="font-mono text-[var(--color-pub-text-primary)]">
              {email}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-pub-border)]">
            <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
              <Shield className="w-4 h-4 text-gray-500" />
              <span>Intended Role</span>
            </div>
            <span className="font-semibold px-2 py-0.5 rounded bg-white border border-[var(--color-pub-border)] text-[var(--color-pub-text-primary)]">
              {role}
            </span>
          </div>

          {teamName && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--color-pub-text-secondary)]">
                <Users className="w-4 h-4 text-gray-500" />
                <span>Assigned Team</span>
              </div>
              <span className="font-semibold text-[var(--color-pub-text-primary)]">
                {teamName}
              </span>
            </div>
          )}
        </div>

 </>;}
