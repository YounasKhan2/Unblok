/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MarketingSectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  hasBorder?: boolean;
}

export const MarketingSection: React.FC<MarketingSectionProps> = ({
  id,
  children,
  className = '',
  hasBorder = false,
}) => {
  return (
    <section
      id={id}
      className={`py-16 sm:py-24 lg:py-28 relative ${
        hasBorder ? 'border-b border-[#e5e3df]' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
};
