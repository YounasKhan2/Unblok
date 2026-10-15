import React from 'react';
import { BarChart2, GitFork, ArrowRight } from 'lucide-react';
/** Shared presentation extracted from InsightsPage; demo supplies its original toolbar and body. */
export function InsightsPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas">
 {header??(<div className="border-b border-border bg-surface-base px-6 py-3.5 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent"/>
          <h1 className="text-sm font-bold text-text-primary tracking-tight">
            Execution Intelligence
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Deterministic delivery risk, active blockers, and dependency bottlenecks across your workspace.
        </p>
      </div>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Insights are not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
