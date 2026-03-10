/**
 * Remark plugin to parse {{ fieldId }} syntax into pill nodes.
 * This enables pills to persist through save/reload cycles.
 */

import { $remark } from "@milkdown/utils";

/**
 * Remark plugin that finds {{ fieldId }} patterns in text
 * and converts them to custom pill nodes in the markdown AST.
 */
export const pillParser = $remark("pillParser", () => () => {
  return (tree: any) => {
    // Walk the tree and process text nodes
    function visitNode(node: any, parent: any, index: number) {
      if (node.type === "text") {
        const text = node.value;
        // Match {{fieldId}} with optional escaped underscores {{field\_id}}
        const regex = /\{\{([^}]+)\}\}/g;
        const parts: any[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          // Add text before the match
          if (match.index > lastIndex) {
            parts.push({
              type: "text",
              value: text.slice(lastIndex, match.index),
            });
          }

          // Clean the field ID by removing backslash escapes
          const cleanFieldId = match[1].replace(/\\/g, "");

          // Add pill node
          parts.push({
            type: "pill",
            value: cleanFieldId, // The field ID without escapes
          });

          lastIndex = regex.lastIndex;
        }

        // Add remaining text after last match
        if (lastIndex > 0) {
          if (lastIndex < text.length) {
            parts.push({
              type: "text",
              value: text.slice(lastIndex),
            });
          }

          // Replace original text node with parts
          if (parent && parent.children && index !== undefined) {
            parent.children.splice(index, 1, ...parts);
            return index + parts.length - 1; // Return new index position
          }
        }
      }

      // Recursively visit children
      if (node.children) {
        let i = 0;
        while (i < node.children.length) {
          const newIndex = visitNode(node.children[i], node, i);
          i = newIndex !== undefined ? newIndex + 1 : i + 1;
        }
      }

      return index;
    }

    visitNode(tree, null, 0);
  };
});
