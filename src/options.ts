import { z } from 'zod';

// What a server built by createServer exposes. The remote connector
// (mcp.hirebalzac.ai) leaves out AI image generation, which the Claude
// connector directory doesn't accept: its tools offer no AI style or ai mode,
// only title overlays and stock photos, and regenerate_article_picture sends
// ai_images=false, so the API draws a title cover on a brand color gradient
// and never falls back to an AI photo for a stock cover. The local npm server
// keeps everything. One gap only the API can close: the cover written with
// a new article follows the workspace's settings, where a title cover gets an
// AI background and a stock cover falls back to AI when no photo matches.
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

// The picture styles the API accepts (Workspace::PICTURES_STYLES). Any other
// value is refused: regenerate_picture answers 422 validation_failed.
export const PICTURE_STYLES = [
  'stock-photo', 'photorealistic', 'anime', 'comic-book', 'cyber-punk', 'pixel-art', 'hand-drawn',
  'line-art', 'isometric', 'origami', 'watercolor', 'flat-illustration', '3d-clay',
] as const;

export const PICTURE_STYLES_TEXT = PICTURE_STYLES.join(', ');

// Every picture style but stock-photo is AI-generated, so without AI images
// stock-photo is the only style a tool can set. label: what the style is
// for, e.g. "Image style".
export function picturesStyleParam(options: ServerOptions, label: string) {
  return options.aiImages
    ? z.string().optional().describe(`${label}: ${PICTURE_STYLES_TEXT}`)
    : z.enum(['stock-photo']).optional().describe('Picture style for cover images: stock-photo (stock photos).');
}

// Managing integrations and deleting workspaces are for company admins. API
// keys count as admin; an OAuth token acts with its user's role.
export const ADMINS_ONLY = 'Admins only; members get 403.';
