import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { readOnly } from '../annotations.js';

export function registerAccountTools(server: McpServer, client: BalzacClient) {
  server.tool(
    'get_account',
    'Get the Balzac account behind these credentials: the company and its available credits, and whether they act as an admin (auth.admin; only admins manage integrations and delete workspaces). For a connected app it also returns the person who approved it, with their role: admin, or user for a member. Use it to check the credits left before an action that costs some.',
    {},
    readOnly('Get account'),
    async () => {
      const res = await client.get('/me');
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
