/**
 * Remark plugin to parse [align:X]...[/align] syntax into alignment nodes.
 * Supports left, center, right, and justify alignment.
 */

import { $remark } from "@milkdown/utils";

/**
 * Remark plugin that finds [align:X] and [/align] markers
 * and groups nodes between them into alignment containers.
 */
export const alignmentParser = $remark("alignmentParser", () => () => {
  return (tree: any) => {
    // Process top-level children to find alignment markers
    if (!tree.children) return;

    let i = 0;
    while (i < tree.children.length) {
      const node = tree.children[i];

      // Check if this is a paragraph containing an opening alignment tag
      if (node.type === "paragraph") {
        const text = getTextContent(node);
        const openMatch = text.match(
          /^\[align:(left|center|right|justify)\]\s*$/,
        );

        if (openMatch) {
          const alignment = openMatch[1].toLowerCase();

          // Find the closing tag
          let closeIndex = -1;
          for (let j = i + 1; j < tree.children.length; j++) {
            const checkNode = tree.children[j];
            if (checkNode.type === "paragraph") {
              const checkText = getTextContent(checkNode);
              if (checkText.match(/^\s*\[\/align\]\s*$/)) {
                closeIndex = j;
                break;
              }
            }
          }

          if (closeIndex !== -1) {
            // Extract nodes between opening and closing tags
            const contentNodes = tree.children.slice(i + 1, closeIndex);

            // Create alignment container with the content nodes
            const alignmentNode = {
              type: "alignmentContainer",
              data: {
                alignment: alignment,
              },
              children: contentNodes,
            };

            // Remove old nodes and insert alignment container
            tree.children.splice(i, closeIndex - i + 1, alignmentNode);

            // Continue from next node after the container
            i++;
            continue;
          }
        }
      }

      i++;
    }

    // Helper to get text content from a node and its children
    function getTextContent(node: any): string {
      if (node.type === "text") {
        return node.value || "";
      }
      if (node.children) {
        return node.children
          .map((child: any) => getTextContent(child))
          .join("");
      }
      return "";
    }
  };
});
