import { z } from 'zod';

// What a server built by createServer exposes. aiImages is false on the
// remote connector (mcp.hirebalzac.ai), since the Claude connector directory
// doesn't accept AI image generation: its tools never ask for an AI image.
// They offer no AI style and no ai mode, title_based_featured_image can only
// be turned off (on, every new article's title cover gets an AI background),
// and regenerate_article_picture sends ai_images=false, so the API draws a
// title cover on a brand color gradient and never falls back to an AI photo
// for a stock cover. The local npm server keeps everything.
//
// What the connector can't change: the cover written with each new article
// (create_briefing, accept_suggestion, and suggestions accepted on their own
// by auto_accept_suggestions or the autopilot) follows the workspace's
// settings, and the API has no switch that keeps AI out of it. Those
// settings are AI by default: the setup that follows create_workspace picks
// a photorealistic style, or title covers on an AI background, unless it
// recommends stock photos, and replaces the cover settings the call sent.
// Even stock-photo falls back to an AI photo when no stock photo matches.
// Only the API can close this.
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
    ? z.string().optional().describe(`${label}: ${PICTURE_STYLES_TEXT}. Every style but stock-photo is AI-generated, and stock-photo falls back to an AI photo when no stock photo matches a new article.`)
    : z.enum(['stock-photo']).optional().describe('Picture style for the covers of new articles: stock-photo (stock photos). When no stock photo matches a new article, its cover is an AI photo instead.');
}

// title_based_featured_image: on, each new article's cover is its title
// over a background in the brand color, and that background is
// AI-generated. Without AI images, a tool can only turn it off.
export function titleOverlayParam(options: ServerOptions) {
  return options.aiImages
    ? z.boolean().optional().describe('Title overlay covers: true gives each new article a cover with its title over an AI-generated background in the brand color, instead of a picture in pictures_style.')
    : z.literal(false).optional().describe('Send false to turn off title overlay covers, whose background is AI-generated: new covers then follow pictures_style. Title overlays can\'t be turned on here.');
}

// Managing integrations and deleting workspaces are for company admins. API
// keys count as admin; an OAuth token acts with its user's role.
export const ADMINS_ONLY = 'Admins only; members get 403.';
