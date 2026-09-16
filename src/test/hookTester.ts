import React from 'react';
import ReactDOMClient from 'react-dom/client';

// Configure React act environment
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class MockElement {
  nodeType = 1;
  nodeName = 'DIV';
  tagName = 'DIV';
  style = {};
  setAttribute = () => {};
  getAttribute = () => null;
  appendChild = (child: unknown) => child;
  removeChild = (child: unknown) => child;
  insertBefore = (child: unknown) => child;
  addEventListener = () => {};
  removeEventListener = () => {};
  ownerDocument: unknown = null;
}

class MockHTMLElement extends MockElement {}
class MockHTMLIFrameElement extends MockHTMLElement {}

const mockDoc = {
  nodeType: 9,
  createElement: () => new MockHTMLElement(),
  createTextNode: (text: string) => ({ nodeType: 3, textContent: text }),
  createComment: () => ({ nodeType: 8 }),
  documentElement: new MockHTMLElement(),
  body: new MockHTMLElement(),
  head: new MockHTMLElement(),
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const mockStorage: Storage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
})();

const mockWin = {
  document: mockDoc,
  Element: MockElement,
  HTMLElement: MockHTMLElement,
  HTMLIFrameElement: MockHTMLIFrameElement,
  localStorage: mockStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
};

(mockDoc as unknown as { defaultView: typeof mockWin }).defaultView = mockWin;

if (!globalThis.window) {
  Object.defineProperty(globalThis, 'window', { value: mockWin, writable: true });
}
if (!globalThis.document) {
  Object.defineProperty(globalThis, 'document', { value: mockDoc, writable: true });
}
try {
  Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true });
} catch {
  // Ignore if already configured
}

export interface RenderHookResult<T, P> {
  result: { current: T };
  rerender: (newProps?: P) => void;
  unmount: () => void;
}

export function renderHook<T, P = void>(
  useHook: (props: P) => T,
  initialProps?: P
): RenderHookResult<T, P> {
  const container = new MockHTMLElement();
  container.ownerDocument = mockDoc;
  const root = ReactDOMClient.createRoot(container as unknown as HTMLElement);

  const result = { current: undefined as unknown as T };
  let currentProps = initialProps as P;

  function HookWrapper({ props }: { props: P }) {
    result.current = useHook(props);
    return null;
  }

  React.act(() => {
    root.render(React.createElement(HookWrapper, { props: currentProps }));
  });

  return {
    result,
    rerender: (newProps?: P) => {
      currentProps = newProps !== undefined ? newProps : currentProps;
      React.act(() => {
        root.render(React.createElement(HookWrapper, { props: currentProps }));
      });
    },
    unmount: () => {
      React.act(() => {
        root.unmount();
      });
    },
  };
}

export const act = React.act;
