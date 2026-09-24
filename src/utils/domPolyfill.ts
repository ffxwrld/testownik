/**
 * DOM mutation polyfill / safety guard against third-party DOM modifications
 * (such as Google Translate, Samsung Internet Translator, browser extensions).
 *
 * When automatic page translation or extensions inject <font> / <span> tags,
 * React's reconciliation can fail with:
 * "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
 * or
 * "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
 */

export function installDOMPolyfills(): void {
  if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
    return;
  }

  // Idempotence check
  const anyNodeProto = Node.prototype as unknown as { __testownik_dom_patched?: boolean };
  if (anyNodeProto.__testownik_dom_patched) {
    return;
  }
  anyNodeProto.__testownik_dom_patched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console && typeof console.warn === 'function') {
        console.warn(
          '[domPolyfill] removeChild: child is not a direct child of parent. Attempting safe removal from actual parent.',
          child,
          this
        );
      }
      if (child.parentNode) {
        return originalRemoveChild.call(child.parentNode, child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && typeof console.warn === 'function') {
        console.warn(
          '[domPolyfill] insertBefore: referenceNode is not a child of parent. Appending newNode directly to parent.',
          newNode,
          referenceNode,
          this
        );
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Auto-execute immediately upon import
installDOMPolyfills();

// Polyfill dla starszych przeglądarek (Chrome < 92, stare Samsung Internet)
if (typeof window !== 'undefined' && window.crypto) {
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function() {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
      ) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

// Polyfill globalThis dla bardzo starych urządzeń
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// Polyfill Array.prototype.at (Chrome < 92)
if (!(Array.prototype as any).at) {
  (Array.prototype as any).at = function(n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  };
}

// Polyfill String.prototype.replaceAll (Chrome < 85)
if (!(String.prototype as any).replaceAll) {
  (String.prototype as any).replaceAll = function(str: string | RegExp, newStr: string) {
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str as RegExp, newStr);
    }
    return this.replace(new RegExp(str.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
  };
}
