import * as React from 'react';
/**
 * Text input with label and optional error state.
 */
export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: React.ReactNode;
}
export declare function Input(props: InputProps): JSX.Element;
