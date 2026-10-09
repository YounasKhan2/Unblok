/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicDocumentLayout, DocumentSection } from '../../features/public/components/PublicDocumentLayout';

const TERMS_SECTIONS: DocumentSection[] = [
  {
    id: 'status',
    title: 'Pre-Launch Status',
    content: (
      <>
        <p>
          Unblok is currently pre-launch. This page is an informational notice describing our pre-launch status and is not the final commercial Terms of Service.
        </p>
        <p>
          Nothing on the current page or across our preview web surfaces should be interpreted as a final commercial agreement, service contract, or enforceable commercial commitment.
        </p>
      </>
    ),
  },
  {
    id: 'future-terms',
    title: 'Commercial Terms Publication',
    content: (
      <>
        <p>
          Final, legally reviewed terms will be published before commercial and production availability.
        </p>
        <p>
          Those future terms are expected to address standard enterprise and commercial topics, including:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Account creation, credentials, and authorized workspace access</li>
          <li>Acceptable use policies and platform integrity rules</li>
          <li>Customer data treatment, ownership, and confidentiality</li>
          <li>Intellectual property rights and software licensing</li>
          <li>Commercial billing, subscription plans, and tiers where applicable</li>
          <li>Platform availability commitments and service levels</li>
          <li>Suspension, termination, and data retrieval processes</li>
          <li>Liability limitations, indemnification, and dispute handling</li>
        </ul>
        <p>
          These terms will be established and published by legal counsel prior to production launch; they are not defined or executed in this pre-launch preview.
        </p>
      </>
    ),
  },
  {
    id: 'inquiries',
    title: 'Pre-Launch Inquiries',
    content: (
      <>
        <p>
          Questions concerning Unblok's planned commercial rollout or upcoming terms may be directed through our official communication channels upon production availability.
        </p>
      </>
    ),
  },
];

export const TermsPage: React.FC = () => {
  return (
    <PublicDocumentLayout
      title="Pre-Launch Terms Notice"
      eyebrow="Legal & Governance"
      effectiveDate="October 2026"
      preLaunchNotice="Unblok is currently pre-launch. This page is an informational notice, not the final commercial Terms of Service. Final legally reviewed terms will be published prior to commercial availability."
      sections={TERMS_SECTIONS}
    />
  );
};
