import React from 'react';
import { Network, Plus, ShieldAlert } from 'lucide-react';
/** Shared presentation extracted from DependenciesPage; demo supplies its original toolbar and body. */
export function DependenciesPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-base">
 {header??(<header className="border-b border-border bg-surface-base px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-accent"/>
            <h1 className="text-sm font-bold text-text-primary">Dependency Intelligence</h1>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span>Workspace execution graph and blocker analysis</span>
            <span className="text-border-strong">·</span>

            <span className="text-border-strong">·</span>

            <span className="text-border-strong">·</span>

          </p>
        </div>


        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-accent hover:bg-primary-pressed text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors" disabled>
            <Plus className="w-3.5 h-3.5"/>
            <span>Add Dependency</span>
          </button>
      </header>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Dependencies are not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
