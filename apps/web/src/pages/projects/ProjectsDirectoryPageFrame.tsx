import React from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  ShieldAlert,
  GitFork,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Target,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
/** Shared presentation extracted from ProjectsDirectoryPage; demo supplies its original toolbar and body. */
export function ProjectsDirectoryPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas select-none">
 {header??(<div className="border-b border-border bg-surface-base px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-accent"/>
          <h1 className="text-sm font-bold text-text-primary tracking-tight">Projects Directory</h1>
          <span className="text-xs text-text-muted hidden sm:inline">·</span>
          <span className="text-xs text-text-muted hidden sm:inline">
            Engineering Projects &amp; Delivery Streams
          </span>

        </div>


        <div className="flex items-center gap-2 text-xs flex-wrap">

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none"/>
            <input type="text" placeholder="Filter projects... (/)" className="h-7 w-36 sm:w-48 pl-8 pr-7 bg-surface-muted border border-border rounded-[5px] text-xs text-text-primary placeholder:text-text-muted focus:bg-surface-base focus:border-accent focus:outline-none transition-all" disabled/>
            <button className="absolute right-2 text-text-muted hover:text-text-primary cursor-pointer" disabled>
                <X className="w-3 h-3"/>
              </button>
          </div>


          <select className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer" aria-label="Filter by team" disabled>
            <option>All Teams</option>

          </select>


          <select className="h-7 px-2 bg-surface-muted border border-border rounded-[5px] text-xs text-text-secondary hover:border-border-strong focus:outline-none cursor-pointer" aria-label="Filter by execution posture" disabled>
            <option>All Statuses</option>
            <option>Has Blockers</option>
            <option>Active Work</option>
          </select>

          <button className="h-7 px-2 text-text-muted hover:text-text-primary hover:bg-surface-muted rounded-[5px] transition-colors cursor-pointer" disabled>
              Reset
            </button>

          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5"/>} data-testid="create-project-button" disabled>
              Create project
            </Button>
        </div>
      </div>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Projects are not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
