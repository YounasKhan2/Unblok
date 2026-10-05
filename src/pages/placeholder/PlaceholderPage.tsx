/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface PlaceholderPageProps {
  pageTitle: string;
  targetPhase: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  pageTitle,
  targetPhase,
  description,
}) => {
  const location = useLocation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
      <div className="max-w-md w-full p-6 rounded-lg border border-[#e5e3df] bg-[#fafaf9] shadow-2xs">
        <div className="w-10 h-10 rounded-md bg-[#5645d4]/10 text-[#5645d4] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-5 h-5" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5645d4] text-[11px] font-semibold mb-2">
          <Clock className="w-3 h-3" />
          <span>Scheduled for Phase {targetPhase}</span>
        </div>

        <h2 className="text-base font-bold text-[#1a1a1a] mb-1">{pageTitle}</h2>
        <p className="text-xs text-[#787671] mb-1 font-mono">{location.pathname}</p>
        <p className="text-xs text-[#52504b] mb-6 leading-relaxed">{description}</p>

        <Link to="/my-work" className="inline-block">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Return to My Work
          </Button>
        </Link>
      </div>
    </div>
  );
};
