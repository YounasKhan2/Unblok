/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Layers } from 'lucide-react';
import { MarketingContainer } from './MarketingContainer';

interface NavLinkItem {
  label: string;
  href: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Product', href: '/product' },
  { label: 'Features', href: '/features' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
];

export const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll and manage focus trap when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';

      // Move focus into the first focusable element of the menu
      const timer = setTimeout(() => {
        if (menuRef.current) {
          const focusables = menuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  // Keyboard navigation: Escape key to dismiss & Tab key focus trap
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        toggleBtnRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        if (!menuRef.current) return;
        const focusables = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !menuRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !menuRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Outside click dismissal
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
        toggleBtnRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--color-pub-bg)]/90 backdrop-blur-md border-b border-[var(--color-pub-border)] transition-colors">
      <MarketingContainer>
        <div className="flex items-center justify-between h-[60px]">
          {/* Brand Mark & Logo */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[var(--color-pub-text-primary)] font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
              aria-label="Unblok Home"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--color-pub-accent)] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
                <Layers className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">Unblok</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-[var(--color-pub-accent)] bg-[var(--color-pub-accent-subtle)]'
                        : 'text-[var(--color-pub-text-secondary)] hover:text-[var(--color-pub-text-primary)] hover:bg-black/[0.04]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Action CTAs: Route to Auth Boundary */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="pub-btn-ghost text-sm font-medium text-[var(--color-pub-text-secondary)] hover:text-[var(--color-pub-text-primary)]"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="pub-btn-primary text-sm shadow-sm"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Trigger Button */}
          <div className="flex md:hidden items-center">
            <button
              ref={toggleBtnRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[var(--color-pub-text-secondary)] hover:text-[var(--color-pub-text-primary)] hover:bg-black/[0.04] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </MarketingContainer>

      {/* Accessible Mobile Menu Overlay with Full Focus Trap */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          ref={menuRef}
          className="md:hidden fixed inset-x-0 top-[60px] h-[calc(100vh-60px)] z-50 overflow-y-auto border-t border-[var(--color-pub-border)] p-6 flex flex-col justify-between shadow-2xl"
          style={{ backgroundColor: 'var(--color-pub-bg)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-pub-text-muted)] px-3 mb-2">
              Menu
            </p>
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-3 py-3 rounded-lg text-base font-medium min-h-[44px] flex items-center transition-colors ${
                    isActive
                      ? 'text-[var(--color-pub-accent)] bg-[var(--color-pub-accent-subtle)]'
                      : 'text-[var(--color-pub-text-primary)] hover:bg-black/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[var(--color-pub-border)] space-y-3">
            <Link
              to="/login"
              className="pub-btn-secondary w-full justify-center min-h-[48px] text-base"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="pub-btn-primary w-full justify-center min-h-[48px] text-base"
            >
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
