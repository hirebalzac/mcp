import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { picturesStyleParam, titleOverlayParam, type ServerOptions } from '../options.js';
import { readOnly, destructive } from '../annotations.js';

export function registerSettingsTools(server: McpServer, client: BalzacClient, options: ServerOptions) {
  server.tool(
    'get_settings',
    'Get workspace settings including language, article length, pictures style, cover image mode (title_based_featured_image, brand_color, title_font), writing preferences, and content limits.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    readOnly('Get settings'),
    async ({ workspace_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/settings`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'update_settings',
    options.aiImages
      ? 'Update workspace settings: language, article length, pictures style, cover image mode (title overlay, stock photo, AI), tone, auto-accept suggestions, writing style preferences, and more.'
      : 'Update workspace settings: language, article length, cover image mode (stock-photo, or turning off title overlays, whose background is AI-generated), tone, auto-accept suggestions, writing style preferences, and more. The covers of new articles follow these settings, which may use AI images.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      language: z.string().optional().describe('Language code, e.g. en, fr'),
      article_length: z.string().optional().describe('Default article length: short, normal, long, extra_long'),
      pictures_style: picturesStyleParam(options, 'Picture style'),
      title_based_featured_image: titleOverlayParam(options),
      brand_color: z.string().optional().describe('Brand color hex code for title overlay images, e.g. #FF5500'),
      title_font: z.string().optional().describe('Font for title overlay images: montserrat, playfair, poppins, lora, oswald'),
      max_articles_per_period: z.number().optional().describe('Max articles per period'),
      max_articles_period: z.string().optional().describe('Period: day, week, month'),
      prefered_tone_of_voice_id: z.string().optional().describe('Default tone of voice UUID'),
      auto_accept_suggestions: z.boolean().optional().describe('Automatically accept new suggestions'),
      use_title_cases_in_headings: z.boolean().optional().describe('Use title case in article headings'),
      prefer_active_voice: z.boolean().optional().describe('Prefer active voice in articles'),
      write_in_first_person: z.boolean().optional().describe('Write articles in first person'),
    },
    destructive('Update settings', { idempotent: true }),
    async ({ workspace_id, ...params }) => {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) body[k] = v;
      }
      const res = await client.patch(`/workspaces/${workspace_id}/settings`, { settings: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
