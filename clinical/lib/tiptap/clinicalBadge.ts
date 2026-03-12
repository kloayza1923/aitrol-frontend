import { Node, mergeAttributes } from "@tiptap/core";

export const ClinicalBadge = Node.create({
  name: "clinicalBadge",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      kind: {
        default: "cie",
      },
      refId: {
        default: null,
      },
      label: {
        default: "",
      },
      meta: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-clinical-badge]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const kind = HTMLAttributes.kind || "cie";
    const classes = `clinical-badge clinical-badge--${kind}`;
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: classes,
        "data-clinical-badge": "true",
        "data-kind": kind,
      }),
      HTMLAttributes.label || "",
    ];
  },

  renderText({ node }) {
    return node.attrs.label || "";
  },
});
