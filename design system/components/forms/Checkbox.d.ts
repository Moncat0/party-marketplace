import * as React from 'react';
/**
 * Square checkbox with a black fill check state.
 */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
