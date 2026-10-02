import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// MCP tool annotations tell clients how careful to be with each tool: Claude
// and ChatGPT skip confirmation for read-only tools and warn before destructive
// ones. Both connector directories require them on every tool, with every hint
// set explicitly rather than left to the spec's defaults.
//
// openWorld marks tools that reach outside the user's Balzac account: their
// website or CMS (publishing, connection tests) or the public web (crawling a
// site). Everything else stays within Balzac's own data.

interface WriteOptions {
  idempotent?: boolean;
  openWorld?: boolean;
}

export function readOnly(title: string): ToolAnnotations {
  return { title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
}

// Creates data or changes a status without deleting or overwriting anything.
export function additive(title: string, { idempotent = false, openWorld = false }: WriteOptions = {}): ToolAnnotations {
  return { title, readOnlyHint: false, destructiveHint: false, idempotentHint: idempotent, openWorldHint: openWorld };
}

// Deletes data or overwrites what the user had.
export function destructive(title: string, { idempotent = false, openWorld = false }: WriteOptions = {}): ToolAnnotations {
  return { title, readOnlyHint: false, destructiveHint: true, idempotentHint: idempotent, openWorldHint: openWorld };
}
