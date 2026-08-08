import * as React from 'react';
/**
 * Underline tab bar for switching between views.
 */
export interface TabsProps {
  tabs: string[];
  active: string;
  onChange?: (tab: string) => void;
}
export declare function Tabs(props: TabsProps): JSX.Element;
