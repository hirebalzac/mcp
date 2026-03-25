import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

const server = new McpServer({
  name: 'balzac',
  version: '1.0.0',
});

registerWorkspaceTools(server);
registerKeywordTools(server);
registerSuggestionTools(server);
registerBriefingTools(server);
registerArticleTools(server);
registerCompetitorTools(server);
registerLinkTools(server);
registerSettingsTools(server);
registerToneTools(server);
registerIntegrationTools(server);
registerSearchConsoleTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
