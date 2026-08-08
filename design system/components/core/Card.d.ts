import * as React from 'react';
/**
 * Base container card with a black outline and flat offset shadow.
 */
export interface CardProps {
  children: React.ReactNode;
  padding?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
