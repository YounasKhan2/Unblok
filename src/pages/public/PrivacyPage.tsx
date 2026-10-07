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
          This Pre-Launch Privacy Notice describes how Unblok handles information during our active product preview and development phase. Unblok is an execution and dependency intelligence platform designed for software engineering teams.
        </p>
        <p>
          Because Unblok is currently operating as a software prototype and preview system, formal legally binding terms and production data handling contracts will accompany the general availability of the production service.
        </p>
      </>
    ),
  },
  {
    id: 'data-collected',
    title: 'Information Handled During Preview',
    content: (
      <>
        <p>
          During the evaluation preview, data generated within the application is maintained strictly for functional demonstration and interface validation:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Workspace Demonstration Data:</strong> Projects, issues, blocker relationship links, cycles, milestones, and contextual comments entered into the workspace.
          </li>
          <li>
            <strong>Technical Diagnostics:</strong> Standard client-side state logging necessary to diagnose application crashes, rendering faults, and route errors.
          </li>
          <li>
            <strong>Communications:</strong> Inquiries, feedback, and architecture questions submitted directly to the Unblok team via email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-use',
    title: 'How Information is Used',
    content: (
      <>
        <p>
          Information handled in this preview is utilized exclusively to:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Operate and evaluate user interface workflows, dependency graphs, and planning mechanics.</li>
          <li>Validate layout boundaries, focus traps, and accessibility standards.</li>
          <li>Respond to technical and commercial inquiries submitted by evaluating engineering teams.</li>
        </ul>
        <p>
          We do not sell, rent, monetize, or broker workspace data to third parties, advertising networks, or data brokers.
        </p>
      </>
    ),
  },
  {
    id: 'data-isolation',
    title: 'Workspace Isolation & Confidentiality',
    content: (
      <>
        <p>
          Workspace data isolation is a core architectural requirement of Unblok. Projects, issues, and member records are scoped to their containing workspace boundary. In the production architecture, multi-tenant separation is enforced at the database row-level and server-authoritative API layers.
        </p>
      </>
    ),
  },
  {
    id: 'production-commitment',
    title: 'Production Policy Finalization',
    content: (
      <>
        <p>
          Prior to commercial production availability, Unblok will publish a comprehensive, legally vetted Privacy Policy. That policy will address formal data protection rights (including GDPR, CCPA, and applicable regional frameworks), standard data processing agreements (DPAs), and third-party infrastructure sub-processors.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact for Privacy Questions',
    content: (
      <>
        <p>
          If you have questions regarding our privacy architecture or planned data handling policies, contact our team at{' '}
          <a href="mailto:hello@unblok.dev" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
            hello@unblok.dev
          </a>.
        </p>
      </>
    ),
  },
];

export const PrivacyPage: React.FC = () => {
  return (
    <PublicDocumentLayout
      title="Privacy Notice"
      eyebrow="Legal & Transparency"
      effectiveDate="October 2026"
      preLaunchNotice="Unblok is currently in active pre-launch preview. This notice describes our development-phase information handling principles. Comprehensive, legally binding production policies will be published prior to general production availability."
      sections={PRIVACY_SECTIONS}
    />
  );
};
