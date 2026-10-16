import React from 'react';
import { Button } from '../../components/ui/Button';
import { Target, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
/** Shared presentation extracted from MilestonesPage; demo supplies its original toolbar and body. */
export function MilestonesPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-y-auto select-none">
 {header??(<div className="bg-surface-base border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-accent"/>
            <h1 className="text-base font-bold text-text-primary">Strategic Milestones</h1>
          </div>
          <p className="text-xs text-text-muted">
            Workspace-level strategic delivery targets and release goals spanning teams and projects.
          </p>
        </div>

        <Button type="button" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5"/>} disabled>
            Create Milestone
          </Button>
      </div>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Milestones are not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
