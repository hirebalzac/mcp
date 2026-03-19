import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerArticleTools(server: McpServer) {
  server.tool(
    'list_articles',
    'List articles for a workspace. Filter by status (waiting, in_progress, done) or published state.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      status: z.string().optional().describe('Filter: waiting, in_progress, done'),
      published: z.string().optional().describe('Filter: true or false'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/articles`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_article',
    'Get full details of an article. When status is "done", includes the full HTML content, description, main picture URL, and metadata.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
    },
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
    async ({ workspace_id, article_id }) => {
      await client.del(`/workspaces/${workspace_id}/articles/${article_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, article_id }) }] };
    }
  );

  server.tool(
    'rewrite_article',
    'Rewrite an existing article with optional new parameters. Costs 3 credits. Runs asynchronously.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      length: z.string().optional().describe('New length: short, normal, long, extra_long'),
      language: z.string().optional().describe('Language code'),
      tone_of_voice_id: z.string().optional().describe('Tone of voice UUID'),
      additional_instructions: z.string().optional().describe('Instructions for the rewrite, e.g. "make it more technical"'),
    },
    async ({ workspace_id, article_id, ...params }) => {
      const body: Record<string, unknown> = {};
      if (params.length) body.length = params.length;
      if (params.language) body.language = params.language;
      if (params.tone_of_voice_id) body.tone_of_voice_id = params.tone_of_voice_id;
      if (params.additional_instructions) body.additional_instructions = params.additional_instructions;

      await client.post(`/workspaces/${workspace_id}/articles/${article_id}/rewrite`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ started: true, article_id, message: 'Article rewrite started. Poll get_article to check progress.' }) }] };
    }
  );

  server.tool(
    'regenerate_article_picture',
    'Regenerate the main picture of an article. Costs 1 credit. Runs asynchronously.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      pictures_style: z.string().optional().describe('Override picture style'),
      additional_instructions: z.string().optional().describe('Instructions for the image, e.g. "include a laptop"'),
    },
    async ({ workspace_id, article_id, ...params }) => {
      const body: Record<string, unknown> = {};
      if (params.pictures_style) body.pictures_style = params.pictures_style;
      if (params.additional_instructions) body.additional_instructions = params.additional_instructions;

      await client.post(`/workspaces/${workspace_id}/articles/${article_id}/regenerate_picture`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ started: true, article_id, message: 'Picture regeneration started.' }) }] };
    }
  );

  server.tool(
    'publish_article',
    'Publish an article to a connected integration (WordPress, Webflow, Wix, GoHighLevel, or Webhook).',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID to publish to'),
    },
    async ({ workspace_id, article_id, integration_id }) => {
      await client.post(`/workspaces/${workspace_id}/articles/${article_id}/publish`, { integration_id });
      return { content: [{ type: 'text' as const, text: JSON.stringify({ published: true, article_id, integration_id }) }] };
    }
  );

  server.tool(
    'schedule_article',
    'Schedule an article for future publication on a connected integration.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID'),
      scheduled_for: z.string().describe('ISO 8601 datetime, e.g. 2026-04-01T10:00:00Z'),
    },
    async ({ workspace_id, article_id, integration_id, scheduled_for }) => {
      await client.post(`/workspaces/${workspace_id}/articles/${article_id}/schedule`, { integration_id, scheduled_for });
      return { content: [{ type: 'text' as const, text: JSON.stringify({ scheduled: true, article_id, integration_id, scheduled_for }) }] };
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
    async ({ workspace_id, article_id, format }) => {
      const res = await client.get(`/workspaces/${workspace_id}/articles/${article_id}/export`, { export_format: format || 'html' });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
