import * as React from 'react';
/**
 * Transient inline notification banner.
 */
export interface ToastProps {
  tone?: 'neutral' | 'success' | 'danger';
  children: React.ReactNode;
  onClose?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;
