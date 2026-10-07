/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#f4f2ed] border-t border-[#e5e3df] pt-16 pb-12 mt-auto">
      <MarketingContainer>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#e5e3df]">
          {/* Brand & Positioning Column */}
          <div className="col-span-2 space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[#111827] font-bold text-lg tracking-tight"
            >
              <div className="w-6 h-6 rounded-md bg-[#6366f1] flex items-center justify-center text-white">
                <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-base tracking-tight">Unblok</span>
            </Link>
            <p className="text-sm text-[#4b5563] max-w-sm leading-relaxed">
              High-density execution and dependency intelligence for technical engineering teams.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-[#4b5563]">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[#4b5563]">
              <li>
                <Link to="/product" className="hover:text-[#111827] transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-[#111827] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#111827] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/my-work" className="hover:text-[#111827] transition-colors">
                  Live Prototype
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Solutions
            </h4>
            <ul className="space-y-2 text-sm text-[#4b5563]">
              <li>
                <Link to="/solutions" className="hover:text-[#111827] transition-colors">
                  Engineering Teams
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-[#111827] transition-colors">
                  Engineering Leaders
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-[#111827] transition-colors">
                  Consultancies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm text-[#4b5563]">
              <li>
                <Link to="/security" className="hover:text-[#111827] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#111827] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#111827] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#111827] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ca3af]">
          <p>© 2026 Unblok. Minimal. Informative. Creative.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#4b5563] transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#4b5563] transition-colors">
              Terms
            </Link>
            <Link to="/security" className="hover:text-[#4b5563] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </footer>
  );
};
