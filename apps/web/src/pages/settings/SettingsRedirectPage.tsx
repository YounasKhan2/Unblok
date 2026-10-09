import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSettings } from '../../features/settings/context/SettingsContext';
import { getSettingsDefaultRoute } from '../../features/settings/domain/permissions';

export const SettingsRedirectPage: React.FC = () => {
  const { currentUser } = useSettings();
  const defaultRoute = getSettingsDefaultRoute(currentUser.role);

  return <Navigate to={defaultRoute} replace />;
};
