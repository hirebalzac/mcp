import { z } from 'zod';

// What a server built by createServer exposes. aiImages is false on the
// remote connector (mcp.hirebalzac.ai), since the Claude connector directory
// doesn't accept AI image generation: content created through the connector
// never gets AI-generated images. Its tools offer no AI style and no ai
// mode, title_based_featured_image and ai_images can only be turned off,
// and regenerate_article_picture sends ai_images=false. The local npm server
// keeps everything.
//
// The API keeps that guarantee for every request made with an OAuth token,
// which is how Claude and ChatGPT connect: workspaces created through it
// start with ai_images=false (so the setup that follows create_workspace
// picks no AI style), the articles it writes, rewrites or gives a new cover
// (create_briefing, accept_suggestion, rewrite_article,
// regenerate_article_picture) keep AI out of all their covers whatever the
// workspace says now or later, and it can turn ai_images off but never on
// (403). Without AI images, a title cover goes on a gradient of the brand
// color, any other cover is a stock photo, and a first cover with no stock
// match gets the title gradient instead. The API also refuses (403) to let
// a connector turn auto_accept_suggestions on where covers use AI images,
// unless the same request sends ai_images: false. A client using the remote
// server with a bz_ API key gets the same tools, but new articles' covers
// then follow the workspace's ai_images setting.
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
    ? z.string().optional().describe(`${label}: ${PICTURE_STYLES_TEXT}. Every style but stock-photo is AI-generated, and stock-photo falls back to an AI photo when no stock photo matches a new article. With ai_images false (get_settings), every style makes stock photos and nothing falls back to AI.`)
    : z.enum(['stock-photo']).optional().describe('Picture style for the covers of new articles: stock-photo (stock photos). Articles written through this connector never fall back to an AI photo: when no stock photo matches, the first cover is the title on a gradient of the brand color.');
}

// title_based_featured_image: on, each new article's cover is its title
// over a background in the brand color, which is AI-generated unless AI
// images are off (the workspace's ai_images, or an article written through
// the connector), then a plain gradient. Without AI images, a tool can only
// turn it off.
export function titleOverlayParam(options: ServerOptions) {
  return options.aiImages
    ? z.boolean().optional().describe('Title overlay covers: true gives each new article a cover with its title over an AI-generated background in the brand color (a gradient of the brand color when ai_images is false), instead of a picture in pictures_style.')
    : z.literal(false).optional().describe('Send false to turn off title overlay covers: new covers then follow pictures_style. Title overlays can\'t be turned on here.');
}

// ai_images (the workspace's "AI-generated cover images" switch, on by
// default): off, no cover of the workspace uses an AI image. An OAuth
// connector may turn it off, never on (403), so the remote server only
// sends false.
export function aiImagesParam(options: ServerOptions) {
  return options.aiImages
    ? z.boolean().optional().describe('AI-generated cover images (default true). false: no cover of the workspace uses an AI image: title covers go on a gradient of the brand color, other covers are stock photos (an AI pictures_style counts as stock-photo), and a first cover with no stock match gets the title gradient. true allows AI images again.')
    : z.literal(false).optional().describe('Send false to turn off AI-generated cover images for the whole workspace, including articles written in the Balzac app or by autopilot: title covers go on a gradient of the brand color and other covers are stock photos. Articles written through this connector never get AI images either way. AI images can only be turned back on in the Balzac app (true fails with 403 forbidden).');
}

// Managing integrations and deleting workspaces are for company admins. API
// keys count as admin; an OAuth token acts with its user's role.
export const ADMINS_ONLY = 'Admins only; members get 403.';
