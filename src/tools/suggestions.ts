import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../client.js';

export function registerSuggestionTools(server: McpServer) {
  server.tool(
    'list_suggestions',
    'List content suggestions for a workspace. Suggestions are AI-generated article ideas based on keywords. Filter by status: proposed, accepted, rejected.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      status: z.string().optional().describe('Filter: proposed, accepted, or rejected'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/suggestions`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_suggestion',
    'Get full details of a suggestion including topic, title, type, length, language, focus keywords, and description.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      suggestion_id: z.string().describe('Suggestion UUID'),
    },
    async ({ workspace_id, suggestion_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/suggestions/${suggestion_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'generate_suggestions',
    'Trigger AI to generate new content suggestions based on the workspace keywords. Runs asynchronously.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
    },
    async ({ workspace_id }) => {
      await client.post(`/workspaces/${workspace_id}/suggestions/generate`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ started: true, message: 'Suggestion generation started. List suggestions to see new ones.' }) }] };
    }
  );

  server.tool(
    'accept_suggestion',
    'Accept a suggestion to start writing the article. Costs 5 credits. The suggestion status changes to "accepted" and article writing begins.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      suggestion_id: z.string().describe('Suggestion UUID'),
    },
    async ({ workspace_id, suggestion_id }) => {
      const res = await client.post(`/workspaces/${workspace_id}/suggestions/${suggestion_id}/accept`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'reject_suggestion',
    'Reject a suggestion. It will not be used for article writing.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      suggestion_id: z.string().describe('Suggestion UUID'),
    },
    async ({ workspace_id, suggestion_id }) => {
      const res = await client.post(`/workspaces/${workspace_id}/suggestions/${suggestion_id}/reject`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
