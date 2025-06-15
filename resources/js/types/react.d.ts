import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Exportar tipos React comunes
export type ReactElement = React.ReactElement;
export type ReactNode = React.ReactNode;
export type ReactComponentType<P = {}> = React.ComponentType<P>;
export type ReactFC<P = {}> = React.FC<P>;