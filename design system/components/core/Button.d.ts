import * as React from 'react';
/**
 * Primary call-to-action button in the Gigtorget bold-outline style.
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}
export declare function Button(props: ButtonProps): JSX.Element;
