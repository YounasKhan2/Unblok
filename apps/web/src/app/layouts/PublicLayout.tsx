/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../../features/public/components/PublicHeader';
import { PublicFooter } from '../../features/public/components/PublicFooter';
import '../../features/public/styles/public.css';

export const PublicLayout: React.FC = () => {
  return (
    <div className="unblok-public-theme">
      {/* 1. Public Header */}
      <PublicHeader />

      {/* 2. Main Public Content Region */}
      <main id="main-content" className="flex-1 flex flex-col" role="main">
        <Outlet />
      </main>

      {/* 3. Reusable Public Footer */}
      <PublicFooter />
    </div>
  );
};
