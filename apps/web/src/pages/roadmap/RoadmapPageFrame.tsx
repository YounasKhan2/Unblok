import React from 'react';
import { RoadmapToolbar } from '../../features/planning/components/roadmap/RoadmapToolbar';
import { CalendarRange } from 'lucide-react';
/** Shared presentation extracted from RoadmapPage; demo supplies its original toolbar and body. */
export function RoadmapPageFrame({header,children,unavailable=false}:{header?:React.ReactNode;children?:React.ReactNode;unavailable?:boolean}){
 return (<div className="flex-1 flex flex-col h-full bg-surface-subtle overflow-hidden select-none">
 {header??(<RoadmapToolbar unavailable/>)}
 {unavailable?<div className="flex-1 overflow-auto p-6 text-xs text-text-muted"><p role="status">Roadmap is not connected to live backend data. Its business actions are unavailable. No demo records are shown.</p></div>:children}
 </div>);
}
