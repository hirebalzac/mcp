import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import type { ServerOptions } from '../options.js';
import { readOnly, additive, destructive } from '../annotations.js';

const NEW_COVER_TERMS =
  'Generate a new main picture (cover) for a completed article. Free: each article includes 2 new covers on top of the one written with it. Runs asynchronously: main_picture_url changes when it is ready. Fails with 409 conflict while a new cover is already being generated, and 422 free_limit_reached once its 2 free new covers are used.';

export function registerArticleTools(server: McpServer, client: BalzacClient, options: ServerOptions) {
  server.tool(
    'list_articles',
    'List articles for a workspace. Filter by status (waiting, waiting_for_credits, in_progress, done) or published state. Each article includes live_url: the public URL of its latest publication that reported one, or null. get_article also lists the publications.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      status: z.string().optional().describe('Filter: waiting, waiting_for_credits, in_progress, done'),
      published: z.string().optional().describe('Filter: true or false'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    readOnly('List articles'),
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/articles`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_article',
    'Get full details of an article. When status is "done", includes the full HTML content, description, main picture URL, and metadata. Also includes rewriting (true while a rewrite runs), live_url (the public URL of its latest publication that reported one, or null) and publications (id, status, scheduled_for, url, integration_id), where a publication\'s url is filled in once the platform reports where the post went live.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
    },
    readOnly('Get article'),
    async ({ workspace_id, article_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/articles/${article_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'update_article',
    'Update article metadata: title, slug, description, language, or tone of voice.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      title: z.string().optional().describe('New title'),
      slug: z.string().optional().describe('New URL slug'),
      description: z.string().optional().describe('New description/excerpt'),
      language: z.string().optional().describe('Language code'),
      tone_of_voice_id: z.string().optional().describe('Tone of voice UUID'),
    },
    destructive('Update article', { idempotent: true }),
    async ({ workspace_id, article_id, ...params }) => {
      const body: Record<string, unknown> = {};
      if (params.title) body.title = params.title;
      if (params.slug) body.slug = params.slug;
      if (params.description) body.description = params.description;
      if (params.language) body.language = params.language;
      if (params.tone_of_voice_id) body.tone_of_voice_id = params.tone_of_voice_id;

      const res = await client.patch(`/workspaces/${workspace_id}/articles/${article_id}`, { article: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'delete_article',
    'Permanently delete an article.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
    },
    destructive('Delete article', { idempotent: true }),
    async ({ workspace_id, article_id }) => {
      await client.del(`/workspaces/${workspace_id}/articles/${article_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, article_id }) }] };
    }
  );

  server.tool(
    'rewrite_article',
    'Rewrite a completed article (status "done"), optionally with a new length, language, tone of voice or instructions. Free: each article includes 2 rewrites, and a rewrite counts when it finishes. Runs asynchronously: poll get_article until rewriting is false, and give up after a timeout (a rewrite that fails partway keeps rewriting true). Fails with 409 conflict while a rewrite of the article is already running, and 422 free_limit_reached once its 2 free rewrites are used.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      length: z.string().optional().describe('New length: short, normal, long, extra_long'),
      language: z.string().optional().describe('Language code'),
      tone_of_voice_id: z.string().optional().describe('Tone of voice UUID'),
      additional_instructions: z.string().optional().describe('Instructions for the rewrite, e.g. "make it more technical"'),
    },
    destructive('Rewrite article'),
    async ({ workspace_id, article_id, ...params }) => {
      const body: Record<string, unknown> = {};
      if (params.length) body.length = params.length;
      if (params.language) body.language = params.language;
      if (params.tone_of_voice_id) body.tone_of_voice_id = params.tone_of_voice_id;
      if (params.additional_instructions) body.additional_instructions = params.additional_instructions;

      const res = await client.post<Record<string, unknown>>(`/workspaces/${workspace_id}/articles/${article_id}/rewrite`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ...res.data, message: 'Article rewrite started. Poll get_article until rewriting is false.' }) }] };
    }
  );

  // Without AI images the mode is required: left out, it would fall back to
  // the workspace's default, which can be AI.
  server.tool(
    'regenerate_article_picture',
    options.aiImages
      ? `${NEW_COVER_TERMS} Supports three modes: title (title overlay with brand color), stock (stock photo), ai (AI-generated in a chosen style).`
      : `${NEW_COVER_TERMS} Two modes: title (title overlay with brand color) or stock (stock photo).`,
    options.aiImages
      ? {
          workspace_id: z.string().describe('Workspace UUID'),
          article_id: z.string().describe('Article UUID'),
          picture_mode: z.string().optional().describe('Picture mode: title (title overlay), stock (stock photo), ai (AI generated). Falls back to workspace default if omitted.'),
          pictures_style: z.string().optional().describe('Override picture style (for ai mode): stock-photo, photorealistic, anime, comic-book, cyber-punk, pixel-art, low-poly, line-art, isometric, origami, watercolor, flat-illustration, 3d-clay'),
          additional_instructions: z.string().optional().describe('Instructions for AI-generated images, e.g. "include a laptop". Not used for title or stock modes.'),
        }
      : {
          workspace_id: z.string().describe('Workspace UUID'),
          article_id: z.string().describe('Article UUID'),
          picture_mode: z.enum(['title', 'stock']).describe('Picture mode: title (title overlay with brand color) or stock (stock photo)'),
        },
    destructive('Regenerate article picture'),
    async ({ workspace_id, article_id, ...params }: Record<string, string | undefined>) => {
      const body: Record<string, unknown> = {};
      if (params.picture_mode) body.picture_mode = params.picture_mode;
      if (params.pictures_style) body.pictures_style = params.pictures_style;
      if (params.additional_instructions) body.additional_instructions = params.additional_instructions;

      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/regenerate_picture`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'publish_article',
    'Publish a completed article to a connected integration (WordPress, Webflow, Wix, GoHighLevel, or Webhook) right away. Returns the article with its new publication. The post is sent in the background: published turns true once the platform accepts it, and the live URL (the publication\'s url and the article\'s live_url) appears later, once the platform reports it. Poll get_article to follow it and stop after a timeout; drafts and webhooks that answer without a URL never get one.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID to publish to'),
    },
    additive('Publish article', { openWorld: true }),
    async ({ workspace_id, article_id, integration_id }) => {
      const res = await client.post<Record<string, unknown>>(`/workspaces/${workspace_id}/articles/${article_id}/publish`, { integration_id });
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ...res.data, message: 'Publishing started. The live URL appears later: poll get_article for live_url.' }) }] };
    }
  );

  server.tool(
    'schedule_article',
    'Schedule a completed article for future publication on a connected integration. Returns the article with its scheduled publication.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID'),
      scheduled_for: z.string().describe('ISO 8601 datetime, e.g. 2026-04-01T10:00:00Z'),
    },
    additive('Schedule article', { openWorld: true }),
    async ({ workspace_id, article_id, integration_id, scheduled_for }) => {
      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/schedule`, { integration_id, scheduled_for });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'export_article',
    'Export article content in HTML, Markdown, or XML format.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      format: z.string().optional().describe('Export format: html, markdown, or xml (default html)'),
    },
    readOnly('Export article'),
    async ({ workspace_id, article_id, format }) => {
      const res = await client.get(`/workspaces/${workspace_id}/articles/${article_id}/export`, { export_format: format || 'html' });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
