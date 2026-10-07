/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicDocumentLayout, DocumentSection } from '../../features/public/components/PublicDocumentLayout';

const PRIVACY_SECTIONS: DocumentSection[] = [
  {
    id: 'scope',
    title: 'Scope of this Notice',
    content: (
      <>
        <p>
          This Pre-Launch Privacy Notice describes the current informational state of Unblok during our active pre-launch period. Unblok is an execution and dependency intelligence platform designed for software engineering teams.
        </p>
        <p>
          Unblok is currently pre-launch. This document is a transparency disclosure regarding our active pre-launch state and is not the final commercial Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: 'current-prototype',
    title: 'Current Prototype Demonstrations',
    content: (
      <>
        <p>
          During the active demonstration preview, user interface interactions and demonstration workspace records exist locally within the browser session for interface evaluation.
        </p>
        <p>
          No production workspace server ingestion, background diagnostic tracking, or centralized communication processing is currently active for public preview visitors.
        </p>
      </>
    ),
  },
  {
    id: 'workspace-isolation',
    title: 'Workspace Isolation Requirement',
    content: (
      <>
        <p>
          Workspace isolation is a production requirement and must be enforced authoritatively by the production system.
        </p>
        <p>
          Within the client prototype, cross-workspace relationships are forbidden by the product domain contract. When the multi-tenant backend architecture is deployed, authoritative boundary enforcement will ensure that data remains strictly partitioned.
        </p>
      </>
    ),
  },
  {
    id: 'production-policy',
    title: 'Production Privacy Policy Commitments',
    content: (
      <>
        <p>
          Prior to commercial production availability, a comprehensive, legally vetted production Privacy Policy will be published. That document will authoritatively define:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Information categories collected across accounts and workspaces</li>
          <li>Operational purposes for data processing</li>
          <li>Data retention schedules and deletion mechanics</li>
          <li>Authorized infrastructure sub-processors</li>
          <li>User rights, access requests, and export tools</li>
          <li>Security practices and encryption standards</li>
          <li>Applicable regional obligations (including GDPR, CCPA, and related statutory frameworks)</li>
        </ul>
        <p>
          Specific commitments and operational definitions will be established in that final policy rather than prematurely asserted during pre-launch.
        </p>
      </>
    ),
  },
  {
    id: 'inquiries',
    title: 'Inquiries',
    content: (
      <>
        <p>
          Inquiries regarding Unblok's planned privacy posture and enterprise governance standards will be handled through our official contact channels upon production availability.
        </p>
      </>
    ),
  },
];

export const PrivacyPage: React.FC = () => {
  return (
    <PublicDocumentLayout
      title="Pre-Launch Privacy Notice"
      eyebrow="Legal & Transparency"
      effectiveDate="October 2026"
      preLaunchNotice="Unblok is currently pre-launch. This notice provides an honest description of our pre-launch status. A comprehensive, legally reviewed Privacy Policy will be published prior to general production availability."
      sections={PRIVACY_SECTIONS}
    />
  );
};
