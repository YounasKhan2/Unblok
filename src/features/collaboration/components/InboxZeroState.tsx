/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface InboxZeroStateProps {
  message?: string;
}

export const InboxZeroState: React.FC<InboxZeroStateProps> = ({
  message = "Inbox Zero — You're completely up to date with mentions and blockers.",
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center select-none"
      role="status"
      aria-label="Empty inbox status"
    >
      <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-1">
        Inbox Zero
      </h3>
      <p className="text-xs text-text-muted max-w-sm leading-relaxed">
        {message}
      </p>
    </div>
  );
};
