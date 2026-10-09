/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ProductCaptureProps {
  src: string;
  mobileSrc?: string;
  alt: string;
  displayUrl?: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
  width?: number;
  height?: number;
  shadow?: 'default' | 'elevated' | 'subtle';
}

export const ProductCapture: React.FC<ProductCaptureProps> = ({
  src,
  mobileSrc,
  alt,
  displayUrl,
  className = '',
  priority = false,
  aspectRatio = '16 / 10',
  width = 1440,
  height = 900,
  shadow = 'default',
}) => {
  const shadowClass = {
    subtle: 'shadow-sm',
    default: 'shadow-lg shadow-black/5',
    elevated: 'shadow-2xl shadow-indigo-950/10',
  }[shadow];

  return (
    <figure className={`pub-browser-frame ${shadowClass} ${className} m-0`}>
      {/* Minimalist Browser Bezel Bar */}
      <div className="pub-browser-bar" aria-hidden="true">
        <div className="pub-browser-dot" />
        <div className="pub-browser-dot" />
        <div className="pub-browser-dot" />
        {displayUrl && (
          <div className="pub-browser-url">
            {displayUrl}
          </div>
        )}
      </div>

      {/* Product Screenshot */}
      <div className="relative bg-white overflow-hidden" style={{ aspectRatio }}>
        {mobileSrc ? (
          <picture>
            <source media="(max-width: 640px)" srcSet={mobileSrc} />
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding={priority ? 'sync' : 'async'}
              className="w-full h-full object-cover object-top block"
            />
          </picture>
        ) : (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            className="w-full h-full object-cover object-top block"
          />
        )}
      </div>
    </figure>
  );
};
