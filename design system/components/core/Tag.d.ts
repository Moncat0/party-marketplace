import * as React from 'react';
/**
 * Toggleable filter chip, used in vendor/venue category filter rows.
 */
export interface TagProps {
  selected?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
export declare function Tag(props: TagProps): JSX.Element;
