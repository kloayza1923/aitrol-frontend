'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';

export type SlashCommandItem = {
  title: string;
  description: string;
  action: 'cie' | 'med' | 'lab' | 'rx';
};

type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

type SlashCommandHandle = {
  onKeyDown: (event: KeyboardEvent) => boolean;
};

const SlashCommandList = forwardRef<SlashCommandHandle, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (!items.length) {
          return false;
        }
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }
    }));

    return (
      <div className="rounded-2xl border border-white/10 bg-panel-2 p-2 shadow-panelLg">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`grid gap-1 rounded-xl px-3 py-2 cursor-pointer ${
              index === selectedIndex ? 'bg-white/10' : ''
            }`}
            onClick={() => selectItem(index)}
            role="button"
            tabIndex={0}
          >
            <strong className="text-sm">{item.title}</strong>
            <span className="text-xs text-muted">{item.description}</span>
          </div>
        ))}
      </div>
    );
  }
);

SlashCommandList.displayName = 'SlashCommandList';

export default SlashCommandList;
