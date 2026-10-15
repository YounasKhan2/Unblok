import React from 'react';
import { CheckCheck } from 'lucide-react';
/** Shared presentation extracted from InboxPage; demo supplies its original toolbar and body. */
export function InboxPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-base">
 {header??(<header className="px-4 py-3 border-b border-border bg-surface-base shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">
            Inbox
          </h1>

        </div>

        <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded transition-colors cursor-pointer" title="Mark all active notifications as read" disabled>
            <CheckCheck className="w-3.5 h-3.5"/>
            <span>Mark all read</span>
          </button>
      </header>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Inbox is not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
