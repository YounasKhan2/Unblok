import React from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  X,
  Plus,
  GitFork,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
/** Shared presentation extracted from MyWorkPage; demo supplies its original toolbar and body. */
export function MyWorkPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-canvas">
 {header??(<div className="border-b border-border bg-surface-base px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">My Work</h1>
          <span className="text-xs text-text-muted hidden sm:inline">·</span>
          <span className="text-xs text-text-muted hidden sm:inline">
            Execution Queue
          </span>

        </div>


        <div className="flex items-center gap-2 text-xs">

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 pointer-events-none"/>
            <input type="text" placeholder="Filter tasks... (/)" className="h-7 w-32 sm:w-48 pl-8 pr-2.5 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-primary placeholder:text-text-muted focus:bg-surface-base focus:border-accent focus:outline-none transition-all" disabled/>
            <button className="absolute right-2 text-text-muted hover:text-text-primary" title="Clear search" disabled>
                <X className="w-3 h-3"/>
              </button>
          </div>


          <select className="h-7 px-2 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-secondary hover:border-border focus:outline-none cursor-pointer" aria-label="Filter by state" disabled>
            <option>All States</option>
            <option>Todo</option>
            <option>In Progress</option>
            <option>In Review</option>
            <option>Done</option>
          </select>


          <select className="h-7 px-2 bg-surface-subtle border border-border rounded-[5px] text-xs text-text-secondary hover:border-border focus:outline-none cursor-pointer hidden md:inline-block" aria-label="Filter by priority" disabled>
            <option>All Priorities</option>
            <option>Urgent</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>


          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5"/>} className="font-semibold shadow-2xs" disabled>
            <span className="hidden sm:inline">Create Task</span>
            <span className="sm:hidden">New</span>
            <kbd className="hidden sm:inline-block ml-1 font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded text-white">
              C
            </kbd>
          </Button>
        </div>
      </div>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">My Work is not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
