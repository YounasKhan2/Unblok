import React from 'react';
import {Link} from 'react-router-dom';
import {AlertCircle,ArrowLeft} from 'lucide-react';
/** Existing issue fallback presentation, shared without loading demo issue state. */
export function IssueUnavailable({issueKey,unavailable=false}:{issueKey?:string;unavailable?:boolean}){return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-base text-center">
        <div className="w-14 h-14 rounded-2xl bg-warning/10 border border-warning/30 flex items-center justify-center text-warning mb-4 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-2">{unavailable?'Issues are not connected':'Issue not found'}</h1>
        <p className="text-sm text-text-muted max-w-md mb-6 leading-relaxed">
          {unavailable?'Issue data and business actions are unavailable in live mode. No demo records are shown.':<>The requested issue <span className="font-mono font-semibold text-text-primary">{issueKey || ''}</span> does
          not exist or you do not have permission to view it in this workspace.</>}
        </p>

        <Link
          to="/my-work"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:opacity-90 text-white text-xs font-semibold rounded-lg shadow-sm transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Work</span>
        </Link>
      </div>
);}
