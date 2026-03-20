import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerSettingsTools(server: McpServer) {
  server.tool(
    'get_settings',
    'Get workspace settings including language, article length, pictures style, cover image mode (title_based_featured_image, brand_color, title_font), writing preferences, and content limits.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    async ({ workspace_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/settings`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'update_settings',
    'Update workspace settings: language, article length, pictures style, cover image mode (title overlay, stock photo, AI), tone, auto-accept suggestions, writing style preferences, and more.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      language: z.string().optional().describe('Language code, e.g. en, fr'),
      article_length: z.string().optional().describe('Default article length: short, normal, long, extra_long'),
      pictures_style: z.string().optional().describe('Picture style: stock-photo, photorealistic, anime, comic-book, cyber-punk, pixel-art, low-poly, line-art, isometric, origami, watercolor, flat-illustration, 3d-clay'),
      title_based_featured_image: z.boolean().optional().describe('Enable title overlay mode for cover images. When true, articles get a title overlay image instead of the pictures_style.'),
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
