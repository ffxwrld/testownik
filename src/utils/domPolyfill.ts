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
