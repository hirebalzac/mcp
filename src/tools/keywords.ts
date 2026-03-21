import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerKeywordTools(server: McpServer) {
  server.tool(
    'list_keywords',
    'List keywords for a workspace. Keywords represent topics and drive content suggestions. Filter by status (enabled/disabled).',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      status: z.string().optional().describe('Filter: enabled or disabled'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/keywords`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_keyword',
    'Get full details of a keyword including search volume, competition, CPC, search intent, keyword difficulty, and Google Search Console metrics (clicks, impressions, CTR, position) if GSC is connected.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      keyword_id: z.string().describe('Keyword UUID'),
    },
    async ({ workspace_id, keyword_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/keywords/${keyword_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_keyword',
    'Add a new keyword to the workspace. Balzac will automatically fetch search volume, competition, and intent data.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      name: z.string().describe('Keyword text, e.g. "content marketing strategy"'),
    },
    async ({ workspace_id, name }) => {
      const res = await client.post(`/workspaces/${workspace_id}/keywords`, { keyword: { name } });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'enable_keyword',
    'Enable a keyword so it can be used for content suggestions. Returns an error if the keyword limit for your plan is reached.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      keyword_id: z.string().describe('Keyword UUID'),
    },
    async ({ workspace_id, keyword_id }) => {
      await client.post(`/workspaces/${workspace_id}/keywords/${keyword_id}/enable`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ enabled: true, keyword_id }) }] };
    }
  );

  server.tool(
    'disable_keyword',
    'Disable a keyword to exclude it from content suggestions.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      keyword_id: z.string().describe('Keyword UUID'),
    },
    async ({ workspace_id, keyword_id }) => {
      await client.post(`/workspaces/${workspace_id}/keywords/${keyword_id}/disable`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ disabled: true, keyword_id }) }] };
    }
  );

  server.tool(
    'delete_keyword',
    'Delete a keyword from the workspace.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      keyword_id: z.string().describe('Keyword UUID'),
    },
    async ({ workspace_id, keyword_id }) => {
      await client.del(`/workspaces/${workspace_id}/keywords/${keyword_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, keyword_id }) }] };
    }
  );

  server.tool(
    'generate_keywords',
    'Generate new keywords using AI based on the workspace context. Runs asynchronously — new keywords appear shortly. Returns an error if the keyword limit for your plan is reached.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    async ({ workspace_id }) => {
      const res = await client.post(`/workspaces/${workspace_id}/keywords/generate`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data ?? { started: true, message: 'Generating new keywords. They will appear shortly.' }) }] };
    }
  );
}
