import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerBriefingTools(server: McpServer) {
  server.tool(
    'list_briefings',
    'List briefings (direct article writing instructions) for a workspace. Filter by status: proposed, accepted, rejected.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      status: z.string().optional().describe('Filter: proposed, accepted, or rejected'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/briefings`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_briefing',
    'Get full details of a briefing including topic, title, type, length, focus keywords, instructions, and whether it was derived from Google Search Console insights (gsc_derived).',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      briefing_id: z.string().describe('Briefing UUID'),
    },
    async ({ workspace_id, briefing_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/briefings/${briefing_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_briefing',
    'Create a briefing to directly start writing an article on a given topic. Costs 5 credits. Article writing starts immediately.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      topic: z.string().describe('Article topic, e.g. "How to improve SEO rankings"'),
      title: z.string().optional().describe('Specific article title'),
      type_of: z.string().optional().describe('Article type: ai_recommended, listicle, how-to-guide, comparison, opinion, case-study, tutorial, review'),
      length: z.string().optional().describe('Article length: short, normal, long, extra_long'),
      language: z.string().optional().describe('Language code override'),
      focus_keywords: z.string().optional().describe('Focus keywords for the article'),
      briefing: z.string().optional().describe('Additional writing instructions'),
      tone_of_voice_id: z.string().optional().describe('Tone of voice UUID'),
    },
    async ({ workspace_id, ...params }) => {
      const body: Record<string, unknown> = { topic: params.topic };
      if (params.title) body.title = params.title;
      if (params.type_of) body.type_of = params.type_of;
      if (params.length) body.length = params.length;
      if (params.language) body.language = params.language;
      if (params.focus_keywords) body.focus_keywords = params.focus_keywords;
      if (params.briefing) body.briefing = params.briefing;
      if (params.tone_of_voice_id) body.tone_of_voice_id = params.tone_of_voice_id;

      const res = await client.post(`/workspaces/${workspace_id}/briefings`, { briefing: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
