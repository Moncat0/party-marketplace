import * as React from 'react';
/**
 * Hover tooltip, dark pill above the trigger element.
 */
export interface TooltipProps {
  label: string;
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
