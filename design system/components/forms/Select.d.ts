import * as React from 'react';
/**
 * Native-styled dropdown select.
 */
export interface SelectOption { label?: string; value: string; }
export interface SelectProps {
  label?: string;
  options: (SelectOption | string)[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}
export declare function Select(props: SelectProps): JSX.Element;
