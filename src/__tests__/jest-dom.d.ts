import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeInTheDocument(): T;
    toHaveClass(...classNames: string[]): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeEmpty(): T;
    toBeChecked(): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveStyle(style: string | Record<string, unknown>): T;
    toHaveValue(value?: string | string[] | number): T;
    toHaveTextContent(text: string | RegExp): T;
  }
}
