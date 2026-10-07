/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Protected Route Prototype Boundary
 * Section 18: Guard for authenticated workspace product routes.
 * Handles authenticated, guest redirect, and session-expired re-entry without loops.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSafeReturnTo } from '../domain/safeReturnTo';

interface RequireAuthProps {
  children?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  // If authenticated, grant entry to protected product route
  if (status === 'authenticated') {
    return children ? <>{children}</> : <Outlet />;
  }

  // Calculate safe internal return target, defaulting to /my-work
  const currentPath = location.pathname + location.search;
  const safeReturn = getSafeReturnTo(currentPath, '/my-work');

  // If session expired, navigate to login with expired notice and preserved return destination
  if (status === 'sessionExpired') {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(safeReturn)}&sessionExpired=true`}
        replace
      />
    );
  }

  // Guest: redirect to login with safe return target
  return (
    <Navigate
      to={`/login?returnTo=${encodeURIComponent(safeReturn)}`}
      replace
    />
  );
};
