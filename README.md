# Balzac MCP Server

[![npm version](https://img.shields.io/npm/v/balzac-mcp.svg)](https://www.npmjs.com/package/balzac-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**MCP server for the Balzac AI content platform** -- give AI agents native access to keyword research, article writing, and CMS publishing.

The Balzac MCP server implements the [Model Context Protocol](https://modelcontextprotocol.io) so that AI agents like Claude Desktop, OpenClaw, Claude Code, and any MCP-compatible client can manage your entire content pipeline through structured tool calls.

---

## Remote server (Claude, ChatGPT, and other connectors)

Balzac is also available as a hosted MCP server, with nothing to install:

```
https://mcp.hirebalzac.ai
```

- **Claude** (claude.ai, Desktop, mobile): **Settings > Connectors > Add custom connector**, paste the URL, then sign in to Balzac and allow access.
- **ChatGPT**: turn on developer mode under **Settings > Apps & Connectors > Advanced settings**, create a connector with the URL and OAuth authentication, then sign in to Balzac.
- **Claude Code**: `claude mcp add --transport http balzac https://mcp.hirebalzac.ai`, then run `/mcp` to sign in.

Clients that can't do OAuth can send an API key instead, as an `Authorization: Bearer bz_...` header. You can disconnect apps at any time from your Balzac profile page.

A connected app acts with the role of the person who approved it. Members don't get the admin-only tools (see [Roles](#roles)).

The remote server offers no AI image generation. Its `regenerate_article_picture` asks the API for a cover with no AI image, in one of two modes: `title` (the article title on a gradient of the brand color) or `stock` (a stock photo, which never falls back to AI: when no photo matches, the tool returns `422 no_stock_photo` and nothing is counted, so try again with search words in `additional_instructions`, or use `title`). The cover written with a new article still follows the workspace's cover settings.

The local server below works the same way, using an API key.

---

## Quick Start

### 1. Get your API key

Log in to [Balzac](https://app.hirebalzac.ai), go to **Settings > API Keys**, and generate a key.

### 2. Configure your MCP client

Add to your MCP configuration (Claude Desktop, OpenClaw, or any MCP-compatible host):

```json
{
  "mcpServers": {
    "balzac": {
      "command": "npx",
      "args": ["-y", "balzac-mcp"],
      "env": {
        "BALZAC_API_KEY": "bz_your_api_key_here"
      }
    }
  }
}
```

For **Claude Desktop**, this file lives at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

### 3. Start using it

Once configured, your AI agent can directly call Balzac tools:

> "Research keywords for my site and write an SEO article about the best opportunity"
>
> "Write 3 articles about our top keywords and publish them as drafts to WordPress"
>
> "Rewrite my latest article with a more professional tone"

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BALZAC_API_KEY` | Yes | Your Balzac API key (starts with `bz_`) |
| `BALZAC_API_URL` | No | API base URL (default: `https://api.hirebalzac.ai/v1`) |

The remote server (`npm run start:http`, deployed from the `Dockerfile`) takes its credentials from each request instead of `BALZAC_API_KEY`, and reads:

| Variable | Description |
|----------|-------------|
| `MCP_PUBLIC_URL` | Public URL of the server (`https://mcp.hirebalzac.ai` in production) |
| `BALZAC_AUTH_URL` | OAuth authorization server (default: `https://app.hirebalzac.ai`) |
| `BALZAC_API_URL` | API base URL (default: `https://api.hirebalzac.ai/v1`) |
| `PORT` | Port to listen on (default: `3001`) |

---

## Available Tools

### Account

| Tool | Description |
|------|-------------|
| `get_account` | Account, available credits, and whether the credentials act as an admin |

### Workspaces

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all workspaces (filter by status: new, running, ready, imported, not_imported) |
| `get_workspace` | Get workspace details |
| `create_workspace` | Create a workspace from a domain |
| `update_workspace` | Update workspace settings |
| `delete_workspace` | Delete a workspace (admins only) |

### Keywords

| Tool | Description |
|------|-------------|
| `list_keywords` | List keywords (filter by status) |
| `get_keyword` | Get keyword details (volume, competition, intent, difficulty, GSC metrics) |
| `create_keyword` | Add a keyword |
| `enable_keyword` | Enable a keyword |
| `disable_keyword` | Disable a keyword |
| `delete_keyword` | Delete a keyword |
| `generate_keywords` | Generate new keywords with AI (async) |

### Suggestions

| Tool | Description |
|------|-------------|
| `list_suggestions` | List content suggestions |
| `get_suggestion` | Get suggestion details |
| `generate_suggestions` | Generate 10 new suggestions (1 credit) |
| `accept_suggestion` | Accept and start writing (5 credits) |
| `reject_suggestion` | Reject a suggestion |

### Briefings

| Tool | Description |
|------|-------------|
| `list_briefings` | List briefings |
| `get_briefing` | Get briefing details |
| `create_briefing` | Create a briefing and start writing (5 credits) |

### Articles

| Tool | Description |
|------|-------------|
| `list_articles` | List articles (filter by status, published), with each one's `live_url`, `rewrites_left` and `new_covers_left` |
| `get_article` | Get article details and content, `live_url`, publications, and the free `rewrites_left` and `new_covers_left` |
| `update_article` | Update article metadata |
| `delete_article` | Delete an article |
| `rewrite_article` | Rewrite article content (free, 2 per article) |
| `regenerate_article_picture` | Generate a new cover (free, 2 per article): title, stock photo or, on the local server, an AI style |
| `publish_article` | Publish to an integration (the live URL shows up later in `get_article`) |
| `schedule_article` | Schedule future publication |
| `export_article` | Export as HTML, Markdown, or XML |

### Competitors

| Tool | Description |
|------|-------------|
| `list_competitors` | List competitor domains |
| `create_competitor` | Add a competitor |
| `delete_competitor` | Remove a competitor |

### Links

| Tool | Description |
|------|-------------|
| `list_links` | List reference links |
| `create_link` | Add a reference link |
| `delete_link` | Remove a link |

### Settings

| Tool | Description |
|------|-------------|
| `get_settings` | Get workspace settings |
| `update_settings` | Update workspace settings |

### Tones of Voice

| Tool | Description |
|------|-------------|
| `list_tones` | List available tones |
| `get_tone` | Get tone details |

### Integrations

| Tool | Description |
|------|-------------|
| `list_integrations` | List publishing integrations |
| `get_integration` | Get integration details (credentials are never returned) |
| `create_integration` | Create an integration (WordPress, Webflow, Wix, GoHighLevel, Webhook), admins only |
| `update_integration` | Update integration settings, admins only |
| `delete_integration` | Delete an integration, admins only |
| `reconnect_integration` | Re-test integration connection, admins only |

When `update_integration` moves `wordpress_url` to another site, send `wordpress_application_password` in the same call; when it changes `webhook_url` on an integration with a bearer token, send `webhook_bearer_token`. Otherwise the update fails with `422 validation_failed`.

---

## Credit Costs

| Action | Credits |
|--------|---------|
| Writing an article (accept suggestion or create briefing) | 5 |
| Generating 10 new suggestions | 1 |

If your account doesn't have enough credits, the tool returns an error with the required and available credit counts. `get_account` shows the credits left.

Rewriting an article and generating a new cover are free. Each article includes 2 rewrites and 2 new covers; one counts when it finishes, and `get_article` shows what is left (`rewrites_left`, `new_covers_left`). Starting another while one runs returns `409 conflict`, and once an article has used its 2 the tool returns `422 free_limit_reached`.

---

## Roles

Only admins can manage integrations (`create_integration`, `update_integration`, `delete_integration`, `reconnect_integration`) and delete workspaces (`delete_workspace`). Members get `403 forbidden` there, and can still list integrations and publish to them.

API keys count as admin, so the local server keeps every tool. On the remote server, an app connected by a member doesn't list the admin-only tools at all. Apps cache the tool list, so after a role change (or for a connection made before this update), reconnect the app to refresh it: until then a member calling an admin-only tool gets a "Tool ... not found" error instead of the 403 message, and a newly promoted admin doesn't see those tools yet.

---

## Errors

Tool errors start with the HTTP status and the API's error type, then the message, for example:

```
[422 free_limit_reached] You've used the 2 free rewrites for this article.
[422 plan_limit_reached] Your Columnist plan includes 1 website. Upgrade your plan to add another one.
[403 forbidden] Only company admins can do this. Ask an admin of your Balzac account.
[422 no_stock_photo] No stock photo matches this article. Send a few search words in additional_instructions (for example "laptop on a desk"), or use picture_mode: title.
```

See the [API documentation](https://developer.hirebalzac.ai) for every error type.

---

## See Also

- [Balzac CLI](https://github.com/hirebalzac/cli) -- Command-line interface
- [API Documentation](https://developer.hirebalzac.ai) -- Full REST API reference

---

## License

MIT
