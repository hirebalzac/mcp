import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from '../client.js';
import { readOnly, additive, destructive } from '../annotations.js';
import { ADMINS_ONLY, isAdmin, type ServerOptions } from '../options.js';

// webhook_updates (get_integration shows it for webhooks).
const WEBHOOK_UPDATES =
  'Send an article.updated call when an article already published to the webhook changes in Balzac (with auto_publish on its own, otherwise on "Update on your site", a content refresh, or publishing again). Off, nothing is sent after the first article.published.';

export function registerIntegrationTools(server: McpServer, client: BalzacClient, options: ServerOptions) {
  server.tool(
    'list_integrations',
    'List publishing integrations for a workspace. Integrations connect to WordPress, Webflow, Wix, GoHighLevel, or Webhook endpoints.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      page: z.number().optional().describe('Page number'),
      per_page: z.number().optional().describe('Results per page'),
    },
    readOnly('List integrations'),
    async ({ workspace_id, ...q }) => {
      const res = await client.get(`/workspaces/${workspace_id}/integrations`, q);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'get_integration',
    'Get full details of an integration including service-specific fields and connection status. For a webhook, webhook_updates says whether it gets article.updated calls. Credentials (passwords, API keys and tokens) are write-only and never returned.',
    {
      workspace_id: z.string().describe('Workspace UUID'),
      integration_id: z.string().describe('Integration UUID'),
    },
    readOnly('Get integration'),
    async ({ workspace_id, integration_id }) => {
      const res = await client.get(`/workspaces/${workspace_id}/integrations/${integration_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  // Members can list integrations and publish to them, nothing more.
  if (!isAdmin(options)) return;

  server.tool(
    'create_integration',
    `Create a publishing integration. Provide service-specific credentials. A connection test runs automatically after creation. Supported services: wordpress, webflow, wix, gohighlevel, webhook. ${ADMINS_ONLY}`,
    {
      workspace_id: z.string().describe('Workspace UUID'),
      service: z.string().describe('Service: wordpress, webflow, wix, gohighlevel, webhook'),
      name: z.string().describe('Integration name'),
      auto_publish: z.boolean().optional().describe('Auto-publish completed articles (default false)'),
      wordpress_url: z.string().optional().describe('[wordpress] Site URL'),
      wordpress_username: z.string().optional().describe('[wordpress] Username'),
      wordpress_application_password: z.string().optional().describe('[wordpress] Application password'),
      webflow_api_token: z.string().optional().describe('[webflow] API token'),
      webflow_site_id: z.string().optional().describe('[webflow] Site ID'),
      webflow_collection_id: z.string().optional().describe('[webflow] Collection ID'),
      webflow_publication_status: z.string().optional().describe('[webflow] Publication status: published or draft'),
      wix_api_key: z.string().optional().describe('[wix] API key'),
      wix_site_id: z.string().optional().describe('[wix] Site ID'),
      wix_member_id: z.string().optional().describe('[wix] Member ID'),
      gohighlevel_api_token: z.string().optional().describe('[gohighlevel] API token'),
      gohighlevel_location_id: z.string().optional().describe('[gohighlevel] Location ID'),
      gohighlevel_blog_id: z.string().optional().describe('[gohighlevel] Blog ID'),
      gohighlevel_author_id: z.string().optional().describe('[gohighlevel] Author ID'),
      gohighlevel_category_id: z.string().optional().describe('[gohighlevel] Category ID'),
      gohighlevel_publication_status: z.string().optional().describe('[gohighlevel] Publication status: PUBLISHED or DRAFT'),
      webhook_url: z.string().optional().describe('[webhook] URL to receive POST requests'),
      webhook_bearer_token: z.string().optional().describe('[webhook] Bearer token for authentication'),
      webhook_updates: z.boolean().optional().describe(`[webhook] ${WEBHOOK_UPDATES} Default true. Send false for an endpoint that creates a post on every call, or it gets a duplicate post for each update.`),
    },
    additive('Connect integration', { openWorld: true }),
    async ({ workspace_id, ...params }) => {
      const body: Record<string, unknown> = {
        service: params.service,
        name: params.name,
      };
      if (params.auto_publish !== undefined) body.auto_publish = params.auto_publish;

      const serviceFields = [
        'wordpress_url', 'wordpress_username', 'wordpress_application_password',
        'webflow_api_token', 'webflow_site_id', 'webflow_collection_id', 'webflow_publication_status',
        'wix_api_key', 'wix_site_id', 'wix_member_id',
        'gohighlevel_api_token', 'gohighlevel_location_id', 'gohighlevel_blog_id',
        'gohighlevel_author_id', 'gohighlevel_category_id', 'gohighlevel_publication_status',
        'webhook_url', 'webhook_bearer_token', 'webhook_updates',
      ];
      for (const f of serviceFields) {
        const v = (params as Record<string, unknown>)[f];
        if (v !== undefined) body[f] = v;
      }

      const res = await client.post(`/workspaces/${workspace_id}/integrations`, { integration: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'update_integration',
    `Update an integration. You can change the name, auto_publish, webhook_updates, and service-specific credentials; send only what changes. A connection test runs automatically after update. Moving a URL needs its secret again in the same call: send wordpress_application_password when wordpress_url points to another site (a different scheme, host or port), and webhook_bearer_token when webhook_url changes on an integration that has one. Without it the update fails with 422 validation_failed. ${ADMINS_ONLY}`,
    {
      workspace_id: z.string().describe('Workspace UUID'),
      integration_id: z.string().describe('Integration UUID'),
      name: z.string().optional().describe('New name'),
      auto_publish: z.boolean().optional().describe('Auto-publish toggle'),
      wordpress_url: z.string().optional().describe('[wordpress] Site URL. Moving it to another site needs wordpress_application_password in the same call.'),
      wordpress_username: z.string().optional().describe('[wordpress] Username'),
      wordpress_application_password: z.string().optional().describe('[wordpress] Application password'),
      webflow_api_token: z.string().optional().describe('[webflow] API token'),
      webflow_site_id: z.string().optional().describe('[webflow] Site ID'),
      webflow_collection_id: z.string().optional().describe('[webflow] Collection ID'),
      webflow_publication_status: z.string().optional().describe('[webflow] Publication status'),
      wix_api_key: z.string().optional().describe('[wix] API key'),
      wix_site_id: z.string().optional().describe('[wix] Site ID'),
      wix_member_id: z.string().optional().describe('[wix] Member ID'),
      gohighlevel_api_token: z.string().optional().describe('[gohighlevel] API token'),
      gohighlevel_location_id: z.string().optional().describe('[gohighlevel] Location ID'),
      gohighlevel_blog_id: z.string().optional().describe('[gohighlevel] Blog ID'),
      gohighlevel_author_id: z.string().optional().describe('[gohighlevel] Author ID'),
      gohighlevel_category_id: z.string().optional().describe('[gohighlevel] Category ID'),
      gohighlevel_publication_status: z.string().optional().describe('[gohighlevel] Publication status'),
      webhook_url: z.string().optional().describe('[webhook] URL. Changing it needs webhook_bearer_token in the same call when the integration has one.'),
      webhook_bearer_token: z.string().optional().describe('[webhook] Bearer token'),
      webhook_updates: z.boolean().optional().describe(`[webhook] ${WEBHOOK_UPDATES} Webhooks connected before updates existed have it off: turn it on once the endpoint updates the post it created instead of creating another.`),
    },
    destructive('Update integration', { idempotent: true, openWorld: true }),
    async ({ workspace_id, integration_id, ...params }) => {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) body[k] = v;
      }

      const res = await client.patch(`/workspaces/${workspace_id}/integrations/${integration_id}`, { integration: body });
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );

  server.tool(
    'delete_integration',
    `Delete a publishing integration. ${ADMINS_ONLY}`,
    {
      workspace_id: z.string().describe('Workspace UUID'),
      integration_id: z.string().describe('Integration UUID'),
    },
    destructive('Delete integration', { idempotent: true }),
    async ({ workspace_id, integration_id }) => {
      await client.del(`/workspaces/${workspace_id}/integrations/${integration_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true, integration_id }) }] };
    }
  );

  server.tool(
    'reconnect_integration',
    `Re-test the connection of an integration. The status will go to "pending" until the test completes. ${ADMINS_ONLY}`,
    {
      workspace_id: z.string().describe('Workspace UUID'),
      integration_id: z.string().describe('Integration UUID'),
    },
    additive('Reconnect integration', { idempotent: true, openWorld: true }),
    async ({ workspace_id, integration_id }) => {
      const res = await client.post(`/workspaces/${workspace_id}/integrations/${integration_id}/reconnect`, {});
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data) }] };
    }
  );
}
