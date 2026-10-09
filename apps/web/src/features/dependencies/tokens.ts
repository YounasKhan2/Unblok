/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized Graph Semantic Palette
 * 
 * SVG elements cannot consistently consume Tailwind utility classes for SVG attributes
 * such as stroke, marker fills, and pattern dots. This centralized semantic palette maps
 * cleanly to the design tokens defined in index.css (e.g., var(--color-blocker), var(--color-accent)).
 * 
 * Fallback raw colors match the exact CSS variable definitions in index.css:
 * - blocker: #dd5b00
 * - accent:  #5645d4
 * - danger:  #e03e3e
 * - muted:   #a4a097 / #787671
 * - border:  #c8c4be / #e5e3df
 */
export const GRAPH_SEMANTIC_PALETTE = {
  activeDependency: '#dd5b00',
  resolvedDependency: '#a4a097',
  criticalChain: '#e03e3e',
  selected: '#5645d4',
  gridDot: '#c8c4be',
  border: '#e5e3df',
  textMuted: '#787671',
  fallbackTeam: '#5645d4',
} as const;

/**
 * State badge styling using semantic token utilities
 */
export const DEPENDENCY_STATE_CLASSES: Record<string, string> = {
  BACKLOG: 'bg-surface-muted text-text-muted border-border',
  TODO: 'bg-surface-muted text-text-secondary border-border',
  IN_PROGRESS: 'bg-accent/10 text-accent border-accent/30',
  IN_REVIEW: 'bg-warning/10 text-warning border-warning/30',
  DONE: 'bg-success/10 text-success border-success/30',
  CANCELLED: 'bg-surface-muted text-text-muted/60 border-border line-through',
};
