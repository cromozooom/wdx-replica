/**
 * Alignment container node schema for Milkdown.
 * Wraps content with alignment shortcodes [align:X]...[/align].
 */

import { $node } from "@milkdown/utils";

/**
 * Alignment container node definition.
 * Supports: left, center, right, justify
 */
export const alignmentContainerNode = $node("alignmentContainer", () => ({
  content: "block+",
  group: "block",
  defining: true,
  attrs: {
    alignment: { default: "left" },
  },
  parseDOM: [
    {
      tag: "div[data-alignment]",
      getAttrs: (dom: HTMLElement) => ({
        alignment: dom.getAttribute("data-alignment") || "left",
      }),
    },
  ],
  toDOM: (node: any) => {
    const alignment = node.attrs.alignment || "left";
    return [
      "div",
      {
        "data-alignment": alignment,
        "data-type": "alignment-container",
        class: `alignment-container alignment-${alignment}`,
        style: `text-align: ${alignment};`,
      },
      0, // Content hole - where child nodes go
    ];
  },
  parseMarkdown: {
    match: (node: any) => node.type === "alignmentContainer",
    runner: (state: any, node: any, type: any) => {
      const alignment = node.data?.alignment || "left";
      state.openNode(type, { alignment });

      // Process children
      if (node.children) {
        state.next(node.children);
      }

      state.closeNode();
    },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === "alignmentContainer",
    runner: (state: any, node: any) => {
      const alignment = node.attrs.alignment || "left";

      console.log(
        "🔴 toMarkdown CALLED for alignment:",
        alignment,
        "children:",
        node.content.childCount,
      );

      // Create proper mdast 'html' nodes for the shortcodes
      state.addNode("html", undefined, `[align:${alignment}]`);

      // Render all child content
      state.next(node.content);

      // Close with html node
      state.addNode("html", undefined, `[/align]`);

      console.log("🔴 toMarkdown FINISHED for alignment:", alignment);
    },
  },
}));
