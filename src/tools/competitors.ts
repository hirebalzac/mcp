import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerCompetitorTools(server: McpServer) {
  server.tool(
    'list_competitors',
    'List competitor domains for a workspace. Competitors are analyzed to inform content strategy.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/competitors`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_competitor',
    'Add a competitor domain to a workspace for content strategy analysis.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      name: z.string().describe('Competitor name'),
      domain: z.string().describe('Competitor domain URL, e.g. https://competitor.com'),
    },
    async ({ workspace_id, name, domain }) => {
      const res = await client.post(`/workspaces/${workspace_id}/competitors`, { competitor: { name, domain } });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'delete_competitor',
    'Remove a competitor from the workspace.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      competitor_id: z.string().describe('Competitor UUID'),
    },
    async ({ workspace_id, competitor_id }) => {
      await client.del(`/workspaces/${workspace_id}/competitors/${competitor_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, competitor_id }) }] };
    }
  );
}
