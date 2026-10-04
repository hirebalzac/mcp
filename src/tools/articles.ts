import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { PICTURE_STYLES_TEXT, type ServerOptions } from '../options.js';
import { readOnly, additive, destructive } from '../annotations.js';

const NEW_COVER_TERMS =
  'Generate a new main picture (cover) for a completed article. Free: each article includes 2 new covers on top of the one written with it, and get_article shows new_covers_left. Runs asynchronously: main_picture_url changes when it is ready. Fails with 409 conflict while a new cover is already being generated, and 422 free_limit_reached once its 2 free new covers are used.';

// rewrite, publish and schedule answer with the whole article. Its
// html_content runs to tens of KB, published_html is a second copy of it
// (with the AI disclosure), and schema_json_ld repeats the text of its FAQ.
// Right after a rewrite starts all three are still the old version, so
// these tools leave them out: get_article reads them.
function withoutContent(data: unknown): unknown {
  const article = (data as { article?: unknown } | null)?.article;
  if (!article || typeof article !== 'object') return data;
  const { html_content, published_html, schema_json_ld, ...rest } = article as Record<string, unknown>;
  return { ...(data as Record<string, unknown>), article: rest };
}

export function registerArticleTools(server: McpServer, client: BalzacClient, options: ServerOptions) {
  server.tool(
    'list_articles',
    'List articles for a workspace. Filter by status (waiting, waiting_for_credits, in_progress, done) or published state. Each article includes live_url (the public URL of its latest publication that reported one, or null), and rewrites_left and new_covers_left (its free rewrites and new covers left, 0 to 2). get_article also lists the publications.',
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
    'Get full details of an article. When status is "done", includes the full HTML content (html_content, the article as written; published_html, as it goes to the site, ending with the workspace\'s AI disclosure when that setting is on; schema_json_ld, schema.org JSON-LD as a string), description, main picture URL, and metadata. Also includes rewriting (true while a rewrite runs), rewrites_left and new_covers_left (the free rewrites and new covers it has left, 0 to 2: check them before offering rewrite_article or regenerate_article_picture; one still running is not taken off yet), live_url (the public URL of its latest publication that reported one, or null) and publications (id, status, scheduled_for, url, integration_id), where a publication\'s url is filled in once the platform reports where the post went live.',
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
    'Rewrite a completed article (status "done"), optionally with a new length, language, tone of voice or instructions. Free: each article includes 2 rewrites, and a rewrite counts when it finishes. Runs asynchronously: poll get_article until rewriting is false, and give up after a timeout (a rewrite that fails partway keeps rewriting true). Fails with 409 conflict while a rewrite of the article is already running, and 422 free_limit_reached once its 2 free rewrites are used. Returns the article without its content; get_article reads the new text once the rewrite is done.',
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

      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/rewrite`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ...(withoutContent(res.data) as object), message: 'Article rewrite started. Poll get_article until rewriting is false.' }) }] };
    }
  );

  // Without AI images (the remote connector) the mode is required: left out,
  // it would fall back to the workspace's default, which can be AI. Every
  // request also sends ai_images=false, so the API never generates an AI
  // image for it: a title cover is drawn on a gradient of the brand color,
  // and a stock cover never falls back to an AI photo (422 no_stock_photo
  // when no photo matches, 503 stock_photo_unavailable when the search
  // doesn't answer). Stock always sends the stock-photo style, since without
  // one the API uses the workspace's style.
  server.tool(
    'regenerate_article_picture',
    options.aiImages
      ? `${NEW_COVER_TERMS} Supports three modes: title (the title over a generated background in the brand color), stock (stock photo), ai (AI-generated in a chosen style). An unknown pictures_style fails with 422 validation_failed, whose message lists the valid styles.`
      : `${NEW_COVER_TERMS} Two modes, neither uses AI images: title (the article title on a gradient of the brand color, in the workspace's title font) or stock (a stock photo). When no stock photo matches, it fails with 422 no_stock_photo and nothing is counted: try again with a few search words in additional_instructions, or use title. 503 stock_photo_unavailable means the search did not answer: try again in a minute.`,
    options.aiImages
      ? {
          workspace_id: z.string().describe('Workspace UUID'),
          article_id: z.string().describe('Article UUID'),
          picture_mode: z.string().optional().describe('Picture mode: title (title overlay), stock (stock photo), ai (AI generated). Falls back to workspace default if omitted.'),
          pictures_style: z.string().optional().describe(`Override picture style (for ai mode): ${PICTURE_STYLES_TEXT}`),
          additional_instructions: z.string().optional().describe('For ai mode and title backgrounds, instructions for the image, e.g. "include a laptop". For stock mode, the stock photo search words, e.g. "laptop on a desk".'),
        }
      : {
          workspace_id: z.string().describe('Workspace UUID'),
          article_id: z.string().describe('Article UUID'),
          picture_mode: z.enum(['title', 'stock']).describe('Picture mode: title (the title on a gradient of the brand color) or stock (stock photo)'),
          additional_instructions: z.string().optional().describe('Stock mode only: a few search words for the stock photo, e.g. "laptop on a desk". Without them, the article\'s first focus keyword or its title is searched.'),
        },
    destructive('Regenerate article picture'),
    async ({ workspace_id, article_id, ...params }: Record<string, string | undefined>) => {
      const body: Record<string, unknown> = {};
      if (params.picture_mode) body.picture_mode = params.picture_mode;
      if (params.pictures_style) body.pictures_style = params.pictures_style;
      else if (params.picture_mode === 'stock') body.pictures_style = 'stock-photo';
      if (params.additional_instructions) body.additional_instructions = params.additional_instructions;
      if (!options.aiImages) body.ai_images = false;

      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/regenerate_picture`, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'publish_article',
    'Publish a completed article to a connected integration (WordPress, Webflow, Wix, GoHighLevel, or Webhook) right away. Returns the article (without its content) and its new publication. The post is sent in the background: published turns true once the platform accepts it, and the live URL (the publication\'s url and the article\'s live_url) appears later, once the platform reports it. Poll get_article to follow it and stop after a timeout; drafts and webhooks that answer without a URL never get one. An article already on that integration gets no new publication: the answer has publish.result "already_published" and a message. The message says so when the integration can\'t take updates (GoHighLevel, or a webhook with webhook_updates off) and nothing was sent; otherwise the post there is updated only if the article changed since it was sent.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID to publish to'),
    },
    additive('Publish article', { openWorld: true }),
    async ({ workspace_id, article_id, integration_id }) => {
      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/publish`, { integration_id });
      // Already on that integration: no new publication. publish.message
      // says when nothing was sent because the integration can't take
      // updates; otherwise the post is updated if the article changed.
      const already = (res.data as { publish?: { message?: unknown } } | null)?.publish;
      const message = already
        ? typeof already.message === 'string' ? already.message : 'Already published on this integration.'
        : 'Publishing started. The live URL appears later: poll get_article for live_url.';
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ...(withoutContent(res.data) as object), message }) }] };
    }
  );

  server.tool(
    'schedule_article',
    'Schedule a completed article for future publication on a connected integration. Returns the article (without its content) and its scheduled publication.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      article_id: z.string().describe('Article UUID'),
      integration_id: z.string().describe('Integration UUID'),
      scheduled_for: z.string().describe('ISO 8601 datetime, e.g. 2026-04-01T10:00:00Z'),
    },
    additive('Schedule article', { openWorld: true }),
    async ({ workspace_id, article_id, integration_id, scheduled_for }) => {
      const res = await client.post(`/workspaces/${workspace_id}/articles/${article_id}/schedule`, { integration_id, scheduled_for });
      return { content: [{ type: 'text' as const, text: JSON.stringify(withoutContent(res.data)) }] };
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
