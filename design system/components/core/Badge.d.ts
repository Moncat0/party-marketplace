import * as React from 'react';
/**
 * Small pill label for status or category (e.g. "Chef's pick", "Available").
 */
export interface BadgeProps {
  tone?: 'neutral' | 'primary' | 'secondary' | 'success' | 'outline';
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
