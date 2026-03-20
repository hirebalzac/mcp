import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerWorkspaceTools(server: McpServer) {
  server.tool(
    'list_workspaces',
    'List all workspaces in your Balzac account. Returns id, name, domain, status, and language for each workspace.',
    {
      status: z.string().optional().describe('Filter by status: analyzing, ready, error'),
      page: z.number().optional().describe('Page number (default 1)'),
      per_page: z.number().optional().describe('Results per page (default 25)'),
    },
    async ({ status, page, per_page }) => {
      const res = await client.get('/workspaces', { status, page, per_page });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_workspace',
    'Get full details of a specific workspace including name, domain, status, language, description, target audience, theme, pictures style, cover image mode (title_based_featured_image, brand_color, title_font), and article limits.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    async ({ workspace_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_workspace',
    'Create a new workspace by providing a website domain. Balzac will automatically analyze the site and discover keywords. The workspace status will be "analyzing" until setup completes. Costs no credits.',
    {
      domain: z.string().describe('Website domain, e.g. example.com'),
      name: z.string().optional().describe('Workspace name (auto-detected if omitted)'),
      description: z.string().optional().describe('Description of the workspace'),
      language: z.string().optional().describe('Language code, e.g. en, fr, de'),
      auto_accept_keywords: z.boolean().optional().describe('Auto-accept discovered keywords (default true)'),
      auto_accept_suggestions: z.boolean().optional().describe('Auto-accept generated suggestions'),
      pictures_style: z.string().optional().describe('Image style: stock-photo, photorealistic, anime, comic-book, cyber-punk, pixel-art, low-poly, line-art, isometric, origami, watercolor, flat-illustration, 3d-clay'),
      title_based_featured_image: z.boolean().optional().describe('Enable title overlay mode for cover images'),
      brand_color: z.string().optional().describe('Brand color hex code for title overlay, e.g. #FF5500'),
      title_font: z.string().optional().describe('Font for title overlay: montserrat, playfair, poppins, lora, oswald'),
      max_articles_per_period: z.number().optional().describe('Max articles per period'),
      max_articles_period: z.string().optional().describe('Period: day, week, or month'),
    },
    async (params) => {
      const body: Record<string, unknown> = { domain: params.domain };
      if (params.name) body.name = params.name;
      if (params.description) body.description = params.description;
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
    'Update a workspace name, description, language, pictures style, cover image mode (title overlay), or article limits.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
      language: z.string().optional().describe('Language code'),
      pictures_style: z.string().optional().describe('Image style: stock-photo, photorealistic, anime, comic-book, cyber-punk, pixel-art, low-poly, line-art, isometric, origami, watercolor, flat-illustration, 3d-clay'),
      title_based_featured_image: z.boolean().optional().describe('Enable title overlay mode for cover images'),
      brand_color: z.string().optional().describe('Brand color hex code for title overlay, e.g. #FF5500'),
      title_font: z.string().optional().describe('Font for title overlay: montserrat, playfair, poppins, lora, oswald'),
      max_articles_per_period: z.number().optional().describe('Max articles per period'),
      max_articles_period: z.string().optional().describe('Period: day, week, or month'),
    },
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

  server.tool(
    'delete_workspace',
    'Permanently delete a workspace and all its data.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    async ({ workspace_id }) => {
      await client.del(`/workspaces/${workspace_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, workspace_id }) }] };
    }
  );
}
