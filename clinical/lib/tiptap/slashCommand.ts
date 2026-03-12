import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import SlashCommandList, { SlashCommandItem } from "@/components/SlashCommandList";

export type SlashCommandHandler = (payload: {
  item: SlashCommandItem;
  range: { from: number; to: number };
}) => void;

const COMMANDS: SlashCommandItem[] = [
  {
    title: "CIE10",
    description: "Diagnosticos y codigos CIE",
    action: "cie",
  },
  {
    title: "Medicamentos",
    description: "Agregar receta y dosis",
    action: "med",
  },
  {
    title: "Laboratorio",
    description: "Ordenes de laboratorio",
    action: "lab",
  },
  {
    title: "Imagenologia",
    description: "Ordenes de RX e imagenes",
    action: "rx",
  },
];

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      onCommand: null as SlashCommandHandler | null,
    };
  },

  addProseMirrorPlugins() {
    const onCommand = this.options.onCommand;
    return [
      Suggestion({
        char: "/",
        startOfLine: false,
        items: ({ query }) => {
          if (!query) {
            return COMMANDS;
          }
          return COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        command: ({ range, props }) => {
          if (onCommand) {
            onCommand({ item: props as SlashCommandItem, range });
          }
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let container: HTMLDivElement | null = null;

          const updatePosition = (clientRect?: DOMRect | null) => {
            if (!container || !clientRect) {
              return;
            }
            container.style.position = "absolute";
            container.style.left = `${clientRect.left + window.scrollX}px`;
            container.style.top = `${clientRect.bottom + window.scrollY + 8}px`;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });
              container = document.createElement("div");
              container.style.zIndex = "50";
              document.body.appendChild(container);
              container.appendChild(component.element);
              updatePosition(props.clientRect?.());
            },
            onUpdate: (props) => {
              component?.updateProps(props);
              updatePosition(props.clientRect?.());
            },
            onKeyDown: (props) => {
              if (!component) {
                return false;
              }
              return component.ref?.onKeyDown(props.event) || false;
            },
            onExit: () => {
              component?.destroy();
              component = null;
              if (container) {
                container.remove();
                container = null;
              }
            },
          };
        },
      }),
    ];
  },
});
