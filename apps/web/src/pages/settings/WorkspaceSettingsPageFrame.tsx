import React from 'react';

export function WorkspaceSettingsPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){return (<div className="space-y-6">{header??(<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            Workspace Settings
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure organization profile, enterprise defaults, and workspace parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            Workspace ID:
          </span>
          <code className="text-xs font-mono bg-surface-muted text-text-secondary px-2 py-0.5 rounded select-all border border-border">

          </code>
        </div>
      </div>)}{unavailable?<p role="status" className="text-xs text-text-muted">This settings capability is not connected to a live API. Business actions are unavailable; no demo records are shown.</p>:children}</div>);}
