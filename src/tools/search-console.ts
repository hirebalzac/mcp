import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerSearchConsoleTools(server: McpServer) {
  server.tool(
    'search_console_overview',
    'Get Google Search Console performance overview for a workspace. Returns aggregate metrics (clicks, impressions, CTR, position) for the specified period with comparison to the previous period. Requires an active GSC integration.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD). Default: 30 days before end_date'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD). Default: today'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/search_console`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'search_console_queries',
    'List top search queries from Google Search Console for a workspace. Returns paginated queries ranked by impressions with clicks, CTR, and average position. Requires an active GSC integration.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD). Default: 30 days before end_date'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD). Default: today'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page (max 100)'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/search_console/queries`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'search_console_pages',
    'List top pages from Google Search Console for a workspace. Returns paginated pages ranked by clicks with impressions, CTR, and average position. Requires an active GSC integration.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD). Default: 30 days before end_date'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD). Default: today'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page (max 100)'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/search_console/pages`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'search_console_daily',
    'Get daily Google Search Console performance time series for a workspace. Returns one row per day with clicks, impressions, CTR, and position. Missing days are zero-filled. Useful for trend analysis. Requires an active GSC integration.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD). Default: 30 days before end_date'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD). Default: today'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/search_console/daily`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
