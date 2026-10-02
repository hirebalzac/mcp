// Remote MCP server (Streamable HTTP), deployed at https://mcp.hirebalzac.ai
// so Balzac can be added as a connector in Claude, ChatGPT, and other clients
// that speak MCP over HTTP. It serves the same tools as the stdio server.
//
// Auth: clients send a bearer token, either an OAuth access token issued by
// the Balzac app (the authorization server advertised below) or a `bz_` API
// key. Requests without a valid token get a 401 pointing at the protected
// resource metadata, which is how clients discover where to sign in.
//
// The server is stateless: every request gets a fresh MCP server bound to
// that request's token, so any number of instances can run side by side.
import { createHash } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { BalzacClient, DEFAULT_API_URL } from './client.js';
import { createServer } from './server.js';

const PORT = Number(process.env.PORT || 3001);
const PUBLIC_URL = (process.env.MCP_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const API_URL = process.env.BALZAC_API_URL || DEFAULT_API_URL;
const AUTH_SERVER_URL = (process.env.BALZAC_AUTH_URL || 'https://app.hirebalzac.ai').replace(/\/$/, '');
const DOCS_URL = 'https://developer.hirebalzac.ai';

// The MCP endpoint answers on both /mcp and the bare domain, so either URL
// works when adding the connector. Each gets its own protected resource
// metadata because RFC 9728 requires `resource` to match the URL it describes.
const MCP_PATHS = ['/mcp', '/'];

function resourceUrl(path: string): string {
  return path === '/' ? PUBLIC_URL : `${PUBLIC_URL}${path}`;
}

function resourceMetadataPath(path: string): string {
  return `/.well-known/oauth-protected-resource${path === '/' ? '' : path}`;
}

function jsonRpcError(code: number, message: string) {
  return { jsonrpc: '2.0', error: { code, message }, id: null };
}

// Tokens are checked against the API, which accepts the same OAuth tokens
// and API keys. Successful checks are cached briefly since clients send
// several requests in a row; the API still authenticates every tool call.
const VERIFIED_TOKEN_TTL_MS = 60_000;
const verifiedTokens = new Map<string, number>();

async function isValidToken(token: string): Promise<boolean> {
  const key = createHash('sha256').update(token).digest('hex');
  if ((verifiedTokens.get(key) ?? 0) > Date.now()) return true;

  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const body = (await res.json().catch(() => null)) as { auth?: { expires_at?: string | null } } | null;
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`GET /me returned HTTP ${res.status}`);

  const expiresAt = body?.auth?.expires_at ? Date.parse(body.auth.expires_at) : Infinity;
  if (verifiedTokens.size > 10_000) verifiedTokens.clear();
  verifiedTokens.set(key, Math.min(Date.now() + VERIFIED_TOKEN_TTL_MS, expiresAt));
  return true;
}

function requireBearerToken(mcpPath: string) {
  const resourceMetadataUrl = `${PUBLIC_URL}${resourceMetadataPath(mcpPath)}`;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

    try {
      if (token && (await isValidToken(token))) {
        res.locals.token = token;
        return next();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(502).json(jsonRpcError(-32603, 'Could not reach Balzac to verify your credentials. Try again shortly.'));
    }

    // Per RFC 6750, a request without credentials gets no error code.
    const description = token ? 'The access token is invalid or expired.' : 'Authentication required.';
    const error = token ? `error="invalid_token", error_description="${description}", ` : '';
    res.set('WWW-Authenticate', `Bearer ${error}resource_metadata="${resourceMetadataUrl}"`);
    res.status(401).json({ error: 'invalid_token', error_description: description });
  };
}

async function handleMcpRequest(req: Request, res: Response) {
  const started = Date.now();
  const message = Array.isArray(req.body) ? req.body[0] : req.body;
  const label = message?.method === 'tools/call' ? `tools/call ${message.params?.name}` : message?.method;
  res.on('finish', () => console.log(`${req.method} ${req.path} ${label ?? '-'} ${res.statusCode} ${Date.now() - started}ms`));

  // No AI image generation on the connector: the Claude directory doesn't accept it.
  const server = createServer(new BalzacClient(res.locals.token, API_URL), { aiImages: false });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request failed:', error);
    if (!res.headersSent) res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
  }
}

const app = express();
app.disable('x-powered-by');
app.use(cors({ exposedHeaders: ['Mcp-Session-Id', 'WWW-Authenticate'] }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

for (const path of MCP_PATHS) {
  app.get(resourceMetadataPath(path), (_req, res) => {
    res.json({
      resource: resourceUrl(path),
      authorization_servers: [AUTH_SERVER_URL],
      scopes_supported: ['api'],
      bearer_methods_supported: ['header'],
      resource_name: 'Balzac',
      resource_documentation: DOCS_URL,
    });
  });

  app.post(path, requireBearerToken(path), handleMcpRequest);

  // Stateless server: no standalone SSE stream and no sessions to delete.
  // People opening the URL in a browser land on the docs instead.
  app.all(path, (req, res) => {
    if (req.method === 'GET' && req.accepts(['text/event-stream', 'html']) === 'html') {
      return res.redirect(DOCS_URL);
    }
    res.set('Allow', 'POST').status(405).json(jsonRpcError(-32000, 'Method not allowed.'));
  });
}

app.listen(PORT, () => {
  console.log(`Balzac MCP server listening on port ${PORT} (public URL ${PUBLIC_URL}, API ${API_URL}, auth ${AUTH_SERVER_URL})`);
});
