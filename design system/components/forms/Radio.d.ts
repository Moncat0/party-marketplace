import * as React from 'react';
/**
 * Circular radio button for single-choice option groups.
 */
export interface RadioProps {
  checked?: boolean;
  onChange?: () => void;
  label?: React.ReactNode;
}
export declare function Radio(props: RadioProps): JSX.Element;
