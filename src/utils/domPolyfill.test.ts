import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('domPolyfill', () => {
  beforeEach(async () => {
    // Reset modules and global environment
    vi.resetModules();
  });

  it('prevents removeChild crash when child parentNode differs from target node', async () => {
    // Setup mock Node prototype
    const mockOriginalRemoveChild = vi.fn(function (this: any, child: any) {
      if (child.parentNode !== this) {
        throw new Error("NotFoundError: The node to be removed is not a child of this node.");
      }
      child.parentNode = null;
      return child;
    });

    const mockOriginalInsertBefore = vi.fn(function (this: any, newNode: any, _ref: any) {
      return newNode;
    });

    class MockNode {
      parentNode: MockNode | null = null;
      children: MockNode[] = [];
      removeChild(child: any) {
        return mockOriginalRemoveChild.call(this, child);
      }
      insertBefore(newNode: any, refNode: any) {
        return mockOriginalInsertBefore.call(this, newNode, refNode);
      }
      appendChild(node: any) {
        node.parentNode = this;
        this.children.push(node);
        return node;
      }
    }

    (globalThis as any).Node = MockNode;
    (globalThis as any).window = {};

    // Import polyfill to apply patches
    const { installDOMPolyfills } = await import('./domPolyfill');
    // Ensure prototype has the patched methods
    installDOMPolyfills();

    const grandParent = new MockNode();
    const googleFontWrapper = new MockNode();
    const textNode = new MockNode();

    grandParent.appendChild(googleFontWrapper);
    googleFontWrapper.appendChild(textNode);

    // React calls grandParent.removeChild(textNode) because it expects textNode to be its direct child
    // With polyfill, it should NOT throw, and should remove textNode from googleFontWrapper
    expect(() => {
      const removed = grandParent.removeChild(textNode);
      expect(removed).toBe(textNode);
    }).not.toThrow();

    expect(textNode.parentNode).toBeNull();
  });

  it('prevents insertBefore crash when referenceNode parentNode differs from target node', async () => {
    const mockOriginalInsertBefore = vi.fn(function (this: any, newNode: any, refNode: any) {
      if (refNode && refNode.parentNode !== this) {
        throw new Error("NotFoundError: The node before which the new node is to be inserted is not a child of this node.");
      }
      return newNode;
    });

    class MockNode {
      parentNode: MockNode | null = null;
      children: MockNode[] = [];
      removeChild(child: any) { return child; }
      insertBefore(newNode: any, refNode: any) {
        return mockOriginalInsertBefore.call(this, newNode, refNode);
      }
      appendChild(node: any) {
        node.parentNode = this;
        this.children.push(node);
        return node;
      }
    }

    (globalThis as any).Node = MockNode;
    (globalThis as any).window = {};

    const { installDOMPolyfills } = await import('./domPolyfill');
    installDOMPolyfills();

    const parent = new MockNode();
    const foreignParent = new MockNode();
    const foreignRef = new MockNode();
    foreignParent.appendChild(foreignRef);

    const newNode = new MockNode();

    // parent.insertBefore(newNode, foreignRef) should not throw and should append newNode to parent
    expect(() => {
      const inserted = parent.insertBefore(newNode, foreignRef);
      expect(inserted).toBe(newNode);
    }).not.toThrow();

    expect(parent.children).toContain(newNode);
  });
});
