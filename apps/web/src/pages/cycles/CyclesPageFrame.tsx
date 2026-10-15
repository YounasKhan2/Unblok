import React from 'react';
import { Button } from '../../components/ui/Button';
import { Clock, Plus, Users, Filter, CheckCircle2 } from 'lucide-react';
/** Shared presentation extracted from CyclesPage; demo supplies its original toolbar and body. */
export function CyclesPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-y-auto select-none">
 {header??(<div className="bg-surface-base border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-accent"/>
            <h1 className="text-base font-bold text-text-primary">Team Delivery Cycles</h1>
          </div>
          <p className="text-xs text-text-muted">
            Workspace overview of sprint cadences, active commitments, and completion rollups by team.
          </p>
        </div>

        <div className="flex items-center gap-2.5">

          <div className="flex items-center gap-1.5 text-xs bg-surface-base border border-border rounded-[6px] px-2.5 py-1">
            <Users className="w-3.5 h-3.5 text-text-muted"/>
            <select className="bg-transparent text-text-primary focus:outline-none cursor-pointer" disabled>
              <option>All Teams</option>

            </select>
          </div>

          <Button type="button" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5"/>} disabled>
              Create Cycle
            </Button>
        </div>
      </div>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Cycles are not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
