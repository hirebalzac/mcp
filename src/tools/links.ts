import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerLinkTools(server: McpServer) {
  server.tool(
    'list_links',
    'List reference links for a workspace. Balzac weaves these into articles for better internal and external linking.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/links`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'create_link',
    'Add a reference link to the workspace. Balzac will scrape the URL and use it when writing articles.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      url: z.string().describe('Link URL, e.g. https://example.com/blog/my-post'),
    },
    async ({ workspace_id, url }) => {
      const res = await client.post(`/workspaces/${workspace_id}/links`, { link: { url } });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'delete_link',
    'Remove a reference link from the workspace.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      link_id: z.string().describe('Link UUID'),
    },
    async ({ workspace_id, link_id }) => {
      await client.del(`/workspaces/${workspace_id}/links/${link_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, link_id }) }] };
    }
  );
}
