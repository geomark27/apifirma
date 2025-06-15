import type { route as routeFn } from 'ziggy-js';
import * as React from 'react';

declare global {
    const route: typeof routeFn;
    
    namespace JSX {
        interface Element extends React.ReactElement<any, any> {}
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface ElementClass extends React.Component<any, any> {
            render(): React.ReactNode;
        }
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
        interface IntrinsicAttributes extends React.Attributes {}
        interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> {}
    }
}