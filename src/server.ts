import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BalzacClient } from './client.js';
import type { ServerOptions } from './options.js';
import { registerWorkspaceTools } from './tools/workspaces.js';
import { registerKeywordTools } from './tools/keywords.js';
import { registerSuggestionTools } from './tools/suggestions.js';
import { registerBriefingTools } from './tools/briefings.js';
import { registerArticleTools } from './tools/articles.js';
import { registerCompetitorTools } from './tools/competitors.js';
import { registerLinkTools } from './tools/links.js';
import { registerSettingsTools } from './tools/settings.js';
import { registerToneTools } from './tools/tones.js';
import { registerIntegrationTools } from './tools/integrations.js';
import { registerSearchConsoleTools } from './tools/search-console.js';

const INSTRUCTIONS = `Balzac researches SEO keywords and writes and publishes blog articles for a website.
Everything lives in a workspace (one per website), so start with list_workspaces to find the workspace_id.
Typical flow: keywords, then suggestions (article ideas) to accept, or a briefing to write about a specific topic, then articles, then publishing to an integration (WordPress, Webflow, Wix, GoHighLevel, webhook).
Some actions cost credits; each tool description says how many. Rewrites and new covers are free: each article includes 2 rewrites and 2 new covers.
Only admins can manage integrations (create, update, delete, reconnect) or delete workspaces; members get 403 there, and can still list integrations and publish to them.
Errors start with the HTTP status and error type, e.g. [422 free_limit_reached] or [403 forbidden].`;

export function createServer(client: BalzacClient, options: ServerOptions = { aiImages: true }): McpServer {
  const server = new McpServer({ name: 'balzac', version: '1.0.0' }, { instructions: INSTRUCTIONS });

  registerWorkspaceTools(server, client, options);
  registerKeywordTools(server, client);
  registerSuggestionTools(server, client);
  registerBriefingTools(server, client);
  registerArticleTools(server, client, options);
  registerCompetitorTools(server, client);
  registerLinkTools(server, client);
  registerSettingsTools(server, client, options);
  registerToneTools(server, client);
  registerIntegrationTools(server, client);
  registerSearchConsoleTools(server, client);

  return server;
}
