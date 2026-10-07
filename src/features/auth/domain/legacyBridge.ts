/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Legacy Compatibility Bridge
 * Section 20: Decouples global user identity from workspace roles while maintaining
 * backwards compatibility for existing AppShell components that expect legacy User.role.
 * Scheduled for complete retirement in UX-13 workspace membership lifecycle.
 */

import { AuthenticatedUser, WorkspaceMembership } from '../types';
import { User } from '../../../types';
import { INITIAL_USERS } from '../../../data/mockData';

export function bridgeToLegacyUser(
  authUser: AuthenticatedUser,
  membership?: { role?: any; teamIds?: string[] } | null
): User {
  // Check if this matches a seeded demo user in INITIAL_USERS
  const seeded = INITIAL_USERS.find((u) => u.id === authUser.id || u.email === authUser.email);
  if (seeded) {
    return {
      ...seeded,
      name: authUser.name,
      email: authUser.email,
      role: membership?.role || seeded.role,
      avatar: authUser.avatar || seeded.avatar,
    };
  }

  // Synthesize legacy user shape with decoupled role isolated to active membership
  return {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    avatar: authUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: membership?.role || 'MEMBER',
    teamId: membership?.teamIds?.[0] || 'team_eng',
  };
}
