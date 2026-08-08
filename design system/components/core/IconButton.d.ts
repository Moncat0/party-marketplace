import * as React from 'react';
/**
 * Round icon-only button for compact actions (favorite, share, close).
 */
export interface IconButtonProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
  label: string;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
