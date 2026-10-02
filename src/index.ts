import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BalzacClient, DEFAULT_API_URL } from './client.js';
import { createServer } from './server.js';

const client = new BalzacClient(process.env.BALZAC_API_KEY || '', process.env.BALZAC_API_URL || DEFAULT_API_URL);
const server = createServer(client);

const transport = new StdioServerTransport();
await server.connect(transport);
