/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProject } from '../../../context/ProjectContext';
import { canAccessAdministrativeSettings } from '../domain/permissions';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route protection guard for administrative settings pages.
 * If current user does not have ADMIN role, redirects immediately to /settings/preferences.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser } = useProject();

  if (!canAccessAdministrativeSettings(currentUser.role)) {
    return <Navigate to="/settings/preferences" replace />;
  }

  return <>{children}</>;
};
