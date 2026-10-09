/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Accessible Password Input
 * Section 8: Show/hide toggle, live requirements, Caps Lock detection, autocomplete attributes.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { evaluatePassword, MIN_PASSWORD_LENGTH } from '../domain/passwordRules';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showRequirements?: boolean;
  error?: string;
  autoComplete?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      name,
      label,
      value,
      onChange,
      showRequirements = false,
      error,
      autoComplete = 'current-password',
      placeholder = '••••••••',
      required = true,
      disabled,
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const rules = evaluatePassword(value);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockActive(true);
      } else {
        setCapsLockActive(false);
      }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        setCapsLockActive(true);
      } else {
        setCapsLockActive(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasInteracted) setHasInteracted(true);
      onChange(e);
    };

    const errorId = `${id}-error`;
    const helpId = `${id}-help`;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-[var(--color-pub-text-primary)]"
          >
            {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
          </label>

          {capsLockActive && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
              role="status"
              aria-live="polite"
            >
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Caps Lock on
            </span>
          )}
        </div>

        <div className="relative">
          <input
            {...rest}
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error ? errorId : null, showRequirements ? helpId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-[var(--color-pub-text-primary)] bg-white placeholder:text-[var(--color-pub-text-muted)] focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-[var(--color-pub-border)] focus:border-[var(--color-pub-accent)] focus:ring-indigo-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-pub-text-muted)] hover:text-[var(--color-pub-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pub-accent)] rounded transition-colors"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 stroke-[2]" />
          ) : (
            <Eye className="w-4 h-4 stroke-[2]" />
          )}
        </button>
      </div>

      {error && (
        <p
          id={errorId}
          className="text-xs text-red-600 flex items-center gap-1.5 mt-1 font-medium"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {showRequirements && (hasInteracted || value.length > 0) && (
        <div id={helpId} className="pt-2 pb-1 space-y-1.5" aria-live="polite">
          <p className="text-[11px] font-semibold text-[var(--color-pub-text-muted)]">
            Password requirements:
          </p>
          <ul className="space-y-1 text-xs">
            <li
              className={`flex items-center gap-1.5 ${
                rules.hasMinLength ? 'text-emerald-700 font-medium' : 'text-[var(--color-pub-text-secondary)]'
              }`}
            >
              {rules.hasMinLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pub-border)] mx-1 shrink-0" />
              )}
              <span>At least {MIN_PASSWORD_LENGTH} characters</span>
            </li>
            <li
              className={`flex items-center gap-1.5 ${
                rules.hasLetter ? 'text-emerald-700 font-medium' : 'text-[var(--color-pub-text-secondary)]'
              }`}
            >
              {rules.hasLetter ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pub-border)] mx-1 shrink-0" />
              )}
              <span>At least one letter (a-z)</span>
            </li>
            <li
              className={`flex items-center gap-1.5 ${
                rules.hasNumberOrSpecial
                  ? 'text-emerald-700 font-medium'
                  : 'text-[var(--color-pub-text-secondary)]'
              }`}
            >
              {rules.hasNumberOrSpecial ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-pub-border)] mx-1 shrink-0" />
              )}
              <span>At least one number or special character</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
