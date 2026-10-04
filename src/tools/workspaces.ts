import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { ADMINS_ONLY, isAdmin, picturesStyleParam, titleOverlayParam, type ServerOptions } from '../options.js';
import { readOnly, additive, destructive } from '../annotations.js';

// What the setup after create_workspace picks for the covers of new
// articles. A workspace created with an OAuth token (the remote connector)
// starts with ai_images=false, so the setup picks no AI style.
function setupCovers(options: ServerOptions): string {
  return options.aiImages
    ? 'Unless it recommends stock photos, the covers it picks are AI-generated: a photorealistic style, or the title over an AI background (update_settings with ai_images: false keeps every cover free of AI images).'
    : 'A workspace created through this connector starts with ai_images false, so its covers never use AI images: setup picks stock photos, or the title on a gradient of the brand color.';
}

export function registerWorkspaceTools(server: McpServer, client: BalzacClient, options: ServerOptions) {
  server.tool(
    'list_workspaces',
    'List all workspaces in your Balzac account. Returns id, name, domain, status, and language for each workspace.',
    {
      status: z.string().optional().describe('Filter by status: new, running, ready, imported, not_imported'),
      page: z.number().optional().describe('Page number (default 1)'),
      per_page: z.number().optional().describe('Results per page (default 25)'),
    },
    readOnly('List workspaces'),
    async ({ status, page, per_page }) => {
      const res = await client.get('/workspaces', { status, page, per_page });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_workspace',
    'Get full details of a specific workspace including name, domain, status, language, description, target audience, theme, pictures style, cover image mode (title_based_featured_image, brand_color, title_font), ai_images (false: no AI-generated covers) and cover_mode (title, stock or ai), article limits, and keyword usage limits (keywords_limit: used, max, remaining).',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    readOnly('Get workspace'),
    async ({ workspace_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_workspace',
    `Create a new workspace from a website domain. Balzac analyzes the site to fill in its description, audience, keywords, and competitors; the workspace goes from "new" and "running" to "ready" or "imported" when setup completes, usually within a few minutes ("not_imported" if the site could not be analyzed). Once it understands the site, setup sets its own name, language, cover settings (pictures_style, title_based_featured_image, and the brand_color it finds on the site) and article limits (3 a week), replacing what was sent here: check get_settings once the workspace is ready and change them with update_settings. ${setupCovers(options)} Costs no credits. Fails with 422 plan_limit_reached when the account is at its plan's website limit.`,
    {
      domain: z.string().describe('Website domain, e.g. example.com'),
      name: z.string().optional().describe('Workspace name (auto-detected if omitted)'),
      language: z.string().optional().describe('Language code, e.g. en, fr, de'),
      auto_accept_keywords: z.boolean().optional().describe('Auto-accept discovered keywords (default true)'),
      auto_accept_suggestions: z.boolean().optional().describe('Auto-accept generated suggestions'),
      pictures_style: picturesStyleParam(options, 'Image style'),
      // The remote server could only send false, and setup replaces
      // whatever is sent here anyway.
      ...(options.aiImages ? { title_based_featured_image: titleOverlayParam(options) } : {}),
      brand_color: z.string().optional().describe('Brand color hex code for title overlay, e.g. #FF5500'),
      title_font: z.string().optional().describe('Font for title overlay: montserrat, playfair, poppins, lora, oswald'),
      max_articles_per_period: z.number().optional().describe('Max articles per period'),
      max_articles_period: z.string().optional().describe('Period: day, week, or month'),
    },
    additive('Create workspace', { openWorld: true }),
    async (params: Record<string, unknown> & { domain: string }) => {
      const body: Record<string, unknown> = { domain: params.domain };
      if (params.name) body.name = params.name;
      if (params.language) body.language = params.language;
      if (params.auto_accept_keywords !== undefined) body.auto_accept_keywords = params.auto_accept_keywords;
      if (params.auto_accept_suggestions !== undefined) body.auto_accept_suggestions = params.auto_accept_suggestions;
      if (params.pictures_style) body.pictures_style = params.pictures_style;
      if (params.title_based_featured_image !== undefined) body.title_based_featured_image = params.title_based_featured_image;
      if (params.brand_color) body.brand_color = params.brand_color;
      if (params.title_font) body.title_font = params.title_font;
      if (params.max_articles_per_period !== undefined) body.max_articles_per_period = params.max_articles_per_period;
      if (params.max_articles_period) body.max_articles_period = params.max_articles_period;

      const res = await client.post('/workspaces', { workspace: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'update_workspace',
    options.aiImages
      ? 'Update a workspace name, description, language, pictures style, cover image mode (title overlay), or article limits.'
      : 'Update a workspace name, description, language, pictures style (stock-photo), cover image mode (turning off title overlays), or article limits.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      language: z.string().optional().describe('Language code'),
      pictures_style: picturesStyleParam(options, 'Image style'),
      title_based_featured_image: titleOverlayParam(options),
      brand_color: z.string().optional().describe('Brand color hex code for title overlay, e.g. #FF5500'),
      title_font: z.string().optional().describe('Font for title overlay: montserrat, playfair, poppins, lora, oswald'),
      max_articles_per_period: z.number().optional().describe('Max articles per period'),
      max_articles_period: z.string().optional().describe('Period: day, week, or month'),
    },
    destructive('Update workspace', { idempotent: true }),
    async ({ workspace_id, ...params }) => {
      const body: Record<string, unknown> = {};
      if (params.name) body.name = params.name;
      if (params.description) body.description = params.description;
      if (params.language) body.language = params.language;
      if (params.pictures_style) body.pictures_style = params.pictures_style;
      if (params.title_based_featured_image !== undefined) body.title_based_featured_image = params.title_based_featured_image;
      if (params.brand_color) body.brand_color = params.brand_color;
      if (params.title_font) body.title_font = params.title_font;
      if (params.max_articles_per_period !== undefined) body.max_articles_per_period = params.max_articles_per_period;
      if (params.max_articles_period) body.max_articles_period = params.max_articles_period;

      const res = await client.patch(`/workspaces/${workspace_id}`, { workspace: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  if (!isAdmin(options)) return;

  server.tool(
    'delete_workspace',
    `Permanently delete a workspace and all its data. ${ADMINS_ONLY}`,
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    destructive('Delete workspace', { idempotent: true }),
    async ({ workspace_id }) => {
      await client.del(`/workspaces/${workspace_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, workspace_id }) }] };
    }
  );
}
