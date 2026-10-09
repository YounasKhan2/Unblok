/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Building2,
  MessageSquare,
  Shield,
  Clock,
  Send,
  AlertCircle,
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
    title: 'Product Architecture',
    description: 'Inquire about dependency workflows, cycle planning, or execution mechanics.',
    icon: HelpCircle,
  },
  {
    id: 'evaluation',
    title: 'Team Evaluation',
    description: 'Discuss onboarding engineering teams or workspace organization models.',
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
    description: 'Questions regarding our logical tenant model, role boundaries, or data isolation.',
    icon: Shield,
  },
];

export const ContactPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('product');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const currentCategory = INQUIRY_CATEGORIES.find((c) => c.id === selectedCategory) || INQUIRY_CATEGORIES[0];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero */}
      <PublicPageHero
        eyebrow="Pre-Launch Notice"
        title="Contact the Unblok team"
        description="Unblok is currently pre-launch. Inbound contact channels and dedicated support routing will be established ahead of general availability."
      />

      {/* 2. Main Contact Surface */}
      <MarketingSection className="py-12 sm:py-20 bg-[var(--color-pub-bg)]">
        <MarketingContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left Column: Pre-Launch Inquiries & Information */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-pub-text-primary)] mb-3">
                  Pre-Launch Communications
                </h2>
                <p className="text-sm text-[var(--color-pub-text-secondary)] leading-relaxed">
                  Direct communication channels, technical support desks, and enterprise inquiry routing will activate when Unblok reaches general availability.
                </p>
              </div>

              {/* Status Notice Card */}
              <div className="p-6 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="pub-accent-icon-box w-10 h-10 rounded-xl">
                    <Clock className="w-5 h-5 text-[var(--color-pub-accent)]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-pub-text-muted)] block">
                      Channel Status
                    </span>
                    <span className="text-base font-bold text-[var(--color-pub-text-primary)]">
                      Inbound Closed During Pre-Launch
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-pub-text-secondary)] leading-relaxed pt-2 border-t border-[var(--color-pub-border)]">
                  Public inboxes and formal response SLAs are not active during pre-launch. Operational contact channels will be announced prior to production availability.
                </p>
              </div>

              {/* Inquiry Category Directory */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-pub-text-muted)] mb-3">
                  Planned Inquiry Areas
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

            {/* Right Column: Pre-Launch Inquiry Status Panel */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-pub-surface)] border border-[var(--color-pub-border)] shadow-sm">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-[var(--color-pub-border)] mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-pub-text-primary)]">
                      Inquiry Information
                    </h3>
                    <p className="text-xs text-[var(--color-pub-text-secondary)] mt-0.5">
                      Selected Topic: <span className="font-semibold text-[var(--color-pub-accent)]">{currentCategory.title}</span>
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 font-medium">
                    Pre-Launch Notice
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
                      disabled
                      placeholder={`e.g., Question regarding ${currentCategory.title.toLowerCase()}`}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-pub-border)] bg-[var(--color-pub-surface-subtle)] text-sm text-[var(--color-pub-text-muted)] cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="inquiry-message" className="block text-xs font-semibold text-[var(--color-pub-text-primary)] mb-1.5">
                      Message Notes
                    </label>
                    <textarea
                      id="inquiry-message"
                      rows={5}
                      disabled
                      placeholder="Direct form dispatch is unavailable during pre-launch..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-pub-border)] bg-[var(--color-pub-surface-subtle)] text-sm text-[var(--color-pub-text-muted)] cursor-not-allowed focus:outline-none resize-none"
                    />
                  </div>

                  {/* Pre-launch Inactive Notice */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold text-amber-900 mb-0.5">
                        Inbound Submissions Inactive
                      </strong>
                      <p className="text-amber-900/90 leading-relaxed">
                        Unblok does not currently accept inbound messages or form submissions. Operational contact addresses and team dispatch will be established ahead of general production availability.
                      </p>
                    </div>
                  </div>

                  {/* Disabled Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled
                      className="pub-btn-primary w-full sm:w-auto text-sm justify-center opacity-50 cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Inbound Closed Pre-Launch
                    </button>
                    <span className="text-xs text-[var(--color-pub-text-muted)]">
                      Direct contact channels will open upon production availability.
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
