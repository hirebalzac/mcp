import { z } from 'zod';

// What a server built by createServer exposes. The remote connector
// (mcp.hirebalzac.ai) leaves out AI image generation, which the Claude
// connector directory doesn't accept: its picture tools offer title overlays
// and stock photos only. The local npm server keeps everything.
//
// admin is false when the credentials act as a member (an OAuth token
// approved by one): the admin-only tools are left out, since the API would
// answer them with 403. Left unset, the credentials count as admin, like the
// API keys the local server runs with.
export interface ServerOptions {
  aiImages: boolean;
  admin?: boolean;
}

export function isAdmin(options: ServerOptions): boolean {
  return options.admin !== false;
}

// Every picture style but stock-photo is AI-generated, so without AI images
// stock-photo is the only style a tool can set.
export function picturesStyleParam(options: ServerOptions, aiDescription: string) {
  return options.aiImages
    ? z.string().optional().describe(aiDescription)
    : z.enum(['stock-photo']).optional().describe('Picture style for cover images: stock-photo (stock photos).');
}

// Managing integrations and deleting workspaces are for company admins. API
// keys count as admin; an OAuth token acts with its user's role.
export const ADMINS_ONLY = 'Admins only; members get 403.';
