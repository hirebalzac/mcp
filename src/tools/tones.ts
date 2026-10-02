import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { readOnly } from '../annotations.js';

export function registerToneTools(server: McpServer, client: BalzacClient) {
  server.tool(
    'list_tones',
    'List all available tones of voice that can be applied to workspaces and articles.',
    {},
    readOnly('List tones of voice'),
    async () => {
      const res = await client.get('/tones_of_voice');
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_tone',
    'Get details of a specific tone of voice including name, code, and description.',
    {
      tone_id: z.string().describe('Tone of voice UUID'),
    },
    readOnly('Get tone of voice'),
    async ({ tone_id }) => {
      const res = await client.get(`/tones_of_voice/${tone_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
