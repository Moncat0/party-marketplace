import * as React from 'react';
/**
 * Modal dialog with a bold display-font title and outlined card body.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
