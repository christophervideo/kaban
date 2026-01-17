import { BoxRenderable, type CliRenderer, TextRenderable } from "@opentui/core";
import { COLORS } from "./theme.js";

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  if (maxLength <= 3) return str.slice(0, maxLength);
  const ellipsis = "...";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return str.slice(0, frontChars) + ellipsis + str.slice(-backChars);
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

export interface SectionDividerOptions {
  label: string;
  width: number;
  id: string;
}

export function createSectionDivider(
  renderer: CliRenderer,
  options: SectionDividerOptions,
): BoxRenderable {
  const { label, width, id } = options;
  const labelWithPadding = `─ ${label} `;
  const remainingWidth = width - labelWithPadding.length;
  const line = "─".repeat(Math.max(0, remainingWidth));

  const row = new BoxRenderable(renderer, {
    id: `${id}-divider`,
    width: "100%",
    height: 1,
  });

  const dividerText = new TextRenderable(renderer, {
    id: `${id}-divider-text`,
    content: labelWithPadding + line,
    fg: COLORS.border,
  });

  row.add(dividerText);
  return row;
}
