/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  Building2,
  Shield,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { PublicPageHero } from '../../features/public/components/PublicPageHero';
import { MarketingContainer } from '../../features/public/components/MarketingContainer';
import { MarketingSection } from '../../features/public/components/MarketingSection';

interface CategoryOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const INQUIRY_CATEGORIES: CategoryOption[] = [
  {
    id: 'product',
    title: 'Product Questions',
    description: 'Inquire about dependency workflows, cycle planning, or execution mechanics.',
    icon: HelpCircle,
  },
  {
    id: 'evaluation',
    title: 'Team Evaluation',
    description: 'Discuss onboarding your engineering team or trialing preview workspaces.',
    icon: Building2,
  },
  {
    id: 'consultancy',
    title: 'Consultancy Use',
    description: 'Inquire about multi-project client delivery and cross-team dependency mapping.',
    icon: MessageSquare,
  },
  {
    id: 'security',
    title: 'Security & Architecture',
    description: 'Ask questions about our logical tenant model, role boundaries, or data isolation.',
    icon: Shield,
  },
];

export const ContactPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('product');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const currentCategory = INQUIRY_CATEGORIES.find((c) => c.id === selectedCategory) || INQUIRY_CATEGORIES[0];
  const mailtoUrl = `mailto:hello@unblok.dev?subject=${encodeURIComponent(
    `[Unblok ${currentCategory.title}] ${subject || 'Inquiry'}`
  )}&body=${encodeURIComponent(message || `Hi Unblok team,\n\nI am interested in ${currentCategory.title.toLowerCase()}...`)}`;

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Get In Touch"
        title="Contact the Unblok team"
        description="Have questions about dependency intelligence, team evaluation, or our architectural model? Reach out directly to our engineering team."
      />

      {/* 2. Main Contact Surface */}
      <MarketingSection className="py-12 sm:py-20 bg-[var(--color-pub-bg)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Column: Direct Communication Channels & Context */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-pub-text-primary)] mb-3">
                  Direct Inquiries
                </h2>
                <p className="text-sm text-[var(--color-pub-text-secondary)] leading-relaxed">
                  During our active development preview, all incoming communications are routed directly to our core engineering and product leadership.
                </p>
              </div>

              {/* Direct Email Card */}
              <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="pub-accent-icon-box w-10 h-10 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-pub-text-muted)] block">
                      General & Technical Inquiries
                    </span>
                    <a
                      href="mailto:hello@unblok.dev"
                      className="text-base font-bold text-[var(--color-pub-accent)] hover:underline"
                    >
                      hello@unblok.dev
                    </a>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed pt-2 border-t border-[var(--color-pub-border)]">
                  Expected response within 1 business day for technical evaluation inquiries.
                </p>
              </div>

              {/* Inquiry Category Directory */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-muted)] mb-3">
                  Inquiry Areas
                </h3>
                <div className="space-y-2.5">
                  {INQUIRY_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[var(--color-pub-accent-subtle)] border-[var(--color-pub-accent)] text-[var(--color-pub-text-primary)]'
                            : 'bg-[var(--color-pub-surface)] border-[var(--color-pub-border)] text-[var(--color-pub-text-secondary)] hover:border-[var(--color-pub-border-strong)]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[var(--color-pub-accent)]' : 'text-[var(--color-pub-text-muted)]'}`} />
                        <div>
                          <strong className="text-xs font-bold block text-[var(--color-pub-text-primary)]">
                            {category.title}
                          </strong>
                          <span className="text-[11px] leading-relaxed text-[var(--color-pub-text-secondary)] block">
                            {category.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Prototype-Safe Inquiry Composer */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-[var(--color-pub-border)] mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-pub-text-primary)]">
                      Compose Inquiry
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Selected Topic: <span className="font-semibold text-[var(--color-pub-accent)]">{currentCategory.title}</span>
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] text-[var(--color-pub-text-muted)] font-medium">
                    Prototype Preview
                  </span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="inquiry-subject" className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
                      Subject
                    </label>
                    <input
                      id="inquiry-subject"
                      type="text"
                      placeholder={`e.g., Question regarding ${currentCategory.title.toLowerCase()}`}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-pub-border)] bg-[var(--color-pub-surface)] text-sm text-[var(--color-pub-text-primary)] placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pub-accent)]/20 focus:border-[var(--color-pub-accent)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="inquiry-message" className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
                      Message Notes
                    </label>
                    <textarea
                      id="inquiry-message"
                      rows={5}
                      placeholder="Briefly describe your team structure, current blocker challenges, or architectural question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-pub-border)] bg-[var(--color-pub-surface)] text-sm text-[var(--color-pub-text-primary)] placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pub-accent)]/20 focus:border-[var(--color-pub-accent)] resize-y"
                    />
                  </div>

                  {/* Prototype Transparency Notice */}
                  <div className="p-3.5 rounded-xl bg-[var(--color-pub-surface-subtle)] border border-[var(--color-pub-border)] flex items-start gap-3 text-xs text-[var(--color-pub-text-secondary)]">
                    <Info className="w-4 h-4 text-[var(--color-pub-accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p>
                        <strong>Direct Client Dispatch:</strong> As backend mail processing services are scheduled for production release, clicking below generates a pre-formatted email to <span className="font-semibold text-[var(--color-pub-text-primary)]">hello@unblok.dev</span> to prevent unconfirmed form submissions.
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Link */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href={mailtoUrl}
                      className="pub-btn-primary w-full sm:w-auto text-sm justify-center shadow-sm"
                    >
                      Send via Email Client
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>

                    <span className="text-xs text-[var(--color-pub-text-muted)]">
                      or reach out directly at <strong className="text-[var(--color-pub-text-secondary)]">hello@unblok.dev</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>
    </div>
  );
};
