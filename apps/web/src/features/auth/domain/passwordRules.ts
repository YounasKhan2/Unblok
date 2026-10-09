/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UX-12 Password Validation & Strength Guidance
 * Section 8: Provides responsive client feedback as user types without claiming
 * client validation is authoritative server enforcement.
 */

import { PasswordValidationRules } from '../types';

export const MIN_PASSWORD_LENGTH = 8;

export function evaluatePassword(password: string): PasswordValidationRules {
  const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isValid = hasMinLength && hasLetter && hasNumberOrSpecial;

  return {
    isValid,
    hasMinLength,
    hasLetter,
    hasNumberOrSpecial,
  };
}
