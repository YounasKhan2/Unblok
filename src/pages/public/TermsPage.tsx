/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PublicDocumentLayout, DocumentSection } from '../../features/public/components/PublicDocumentLayout';

const TERMS_SECTIONS: DocumentSection[] = [
  {
    id: 'preview-terms',
    title: 'Pre-Launch Preview Terms',
    content: (
      <>
        <p>
          These Pre-Launch Terms of Service govern your access to and evaluation of the Unblok software application and related public web surfaces during our preview and testing period.
        </p>
        <p>
          By accessing the Unblok preview, you acknowledge that the application is an evolving software system provided for evaluation, interface review, and architecture validation.
        </p>
      </>
    ),
  },
  {
    id: 'evaluation-license',
    title: 'Evaluation License & Permitted Use',
    content: (
      <>
        <p>
          During the preview phase, Unblok grants evaluating users and engineering teams a non-exclusive, revocable, non-transferable license to access the application for evaluation purposes.
        </p>
        <p>
          You agree not to reverse engineer, decompile, or attempt to extract the underlying source code of restricted components, nor use the service to conduct unlawful activities or disrupt the operation of the platform.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property & Workspace Data',
    content: (
      <>
        <p>
          You retain all ownership, rights, and intellectual property in any issue descriptions, project data, code references, or materials entered into your workspace during preview evaluation.
        </p>
        <p>
          Unblok retains all ownership, rights, and intellectual property in the platform design, software code, user interface designs, dependency calculation logic, and trademarks.
        </p>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Service Availability & Data Retention',
    content: (
      <>
        <p>
          The preview is provided on an "as-is" and "as-available" basis. As active software development continues, features, user interfaces, and database schemas may undergo breaking iterations, migrations, or maintenance resets.
        </p>
        <p>
          Evaluating teams should not treat preview environments as an immutable permanent archive for unbacked mission-critical records without local copies.
        </p>
      </>
    ),
  },
  {
    id: 'production-terms',
    title: 'Production Terms of Service',
    content: (
      <>
        <p>
          Formal, legally binding commercial Terms of Service—including service level commitments, commercial billing agreements, and formal dispute resolution provisions—will be established upon general production availability.
        </p>
      </>
    ),
  },
  {
    id: 'inquiries',
    title: 'Questions Regarding Terms',
    content: (
      <>
        <p>
          For legal inquiries, custom evaluation agreements, or questions regarding these terms, please contact our team at{' '}
          <a href="mailto:hello@unblok.dev" className="text-[var(--color-pub-accent)] font-semibold hover:underline">
            hello@unblok.dev
          </a>.
        </p>
      </>
    ),
  },
];

export const TermsPage: React.FC = () => {
  return (
    <PublicDocumentLayout
      title="Terms of Service"
      eyebrow="Legal & Governance"
      effectiveDate="October 2026"
      preLaunchNotice="Unblok is currently in active pre-launch preview. These terms outline the evaluation preview license and platform guidelines. Enforceable commercial terms will accompany our general production availability."
      sections={TERMS_SECTIONS}
    />
  );
};
