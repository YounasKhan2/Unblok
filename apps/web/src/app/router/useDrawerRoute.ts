/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface DrawerRouteState {
  isOpen: boolean;
  drawerIssueKey: string | null;
  drawerTab: string;
  openDrawer: (issueKey: string, tab?: string) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: string) => void;
  navigateToAdjacentIssue: (newIssueKey: string) => void;
}

/**
 * Universal hook connecting the slide-over Issue Drawer to URL query parameters.
 *
 * Pattern:
 *   Base URL:       /my-work?state=TODO
 *   With Drawer:    /my-work?state=TODO&drawer=ENG-142&tab=dependencies
 *   Closing Drawer: /my-work?state=TODO (preserves all filters and base route!)
 *
 * Guarantees:
 * - Directly deep-linkable: loading with ?drawer=ENG-142 safely renders base page and drawer.
 * - Non-destructive close: removes only drawer-specific parameters without relying on history.back().
 */
export function useDrawerRoute(): DrawerRouteState {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const drawerIssueKey = searchParams.get('drawer') || searchParams.get('issue');
  const drawerTab = searchParams.get('tab') || 'properties';
  const isOpen = Boolean(drawerIssueKey);

  const openDrawer = useCallback(
    (issueKey: string, tab?: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('drawer', issueKey);
      nextParams.delete('issue'); // Normalize to drawer
      if (tab) {
        nextParams.set('tab', tab);
      }
      navigate({ search: nextParams.toString() }, { replace: false });
    },
    [searchParams, navigate]
  );

  const closeDrawer = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('drawer');
    nextParams.delete('issue');
    nextParams.delete('tab');
    nextParams.delete('comment');
    const searchString = nextParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchString ? `?${searchString}` : '',
      },
      { replace: true }
    );
  }, [searchParams, location.pathname, navigate]);

  const setDrawerTab = useCallback(
    (tab: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', tab);
      navigate({ search: nextParams.toString() }, { replace: true });
    },
    [searchParams, navigate]
  );

  const navigateToAdjacentIssue = useCallback(
    (newIssueKey: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('drawer', newIssueKey);
      navigate({ search: nextParams.toString() }, { replace: true });
    },
    [searchParams, navigate]
  );

  return useMemo(
    () => ({
      isOpen,
      drawerIssueKey,
      drawerTab,
      openDrawer,
      closeDrawer,
      setDrawerTab,
      navigateToAdjacentIssue,
    }),
    [
      isOpen,
      drawerIssueKey,
      drawerTab,
      openDrawer,
      closeDrawer,
      setDrawerTab,
      navigateToAdjacentIssue,
    ]
  );
}
