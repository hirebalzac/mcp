# Balzac MCP Server

[![npm version](https://img.shields.io/npm/v/balzac-mcp.svg)](https://www.npmjs.com/package/balzac-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**MCP server for the Balzac AI content platform** -- give AI agents native access to keyword research, article writing, and CMS publishing.

The Balzac MCP server implements the [Model Context Protocol](https://modelcontextprotocol.io) so that AI agents like Claude Desktop, OpenClaw, Claude Code, and any MCP-compatible client can manage your entire content pipeline through structured tool calls.

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

---

## Available Tools

### Workspaces

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all workspaces |
| `get_workspace` | Get workspace details |
| `create_workspace` | Create a workspace from a domain |
| `update_workspace` | Update workspace settings |
| `delete_workspace` | Delete a workspace |

### Keywords

| Tool | Description |
|------|-------------|
| `list_keywords` | List keywords (filter by status) |
| `get_keyword` | Get keyword details (volume, competition, intent) |
| `create_keyword` | Add a keyword |
| `enable_keyword` | Enable a keyword |
| `disable_keyword` | Disable a keyword |
| `delete_keyword` | Delete a keyword |

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
| `list_articles` | List articles (filter by status, published) |
| `get_article` | Get article details and content |
| `update_article` | Update article metadata |
| `delete_article` | Delete an article |
| `rewrite_article` | Rewrite article content (3 credits) |
| `regenerate_article_picture` | Regenerate main picture (1 credit) |
| `publish_article` | Publish to an integration |
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
| `get_integration` | Get integration details |
| `create_integration` | Create an integration (WordPress, Webflow, Wix, GoHighLevel, Webhook) |
| `update_integration` | Update integration settings |
| `delete_integration` | Delete an integration |
| `reconnect_integration` | Re-test integration connection |

---

## Credit Costs

| Action | Credits |
|--------|---------|
| Writing an article (accept suggestion or create briefing) | 5 |
| Generating 10 new suggestions | 1 |
| Rewriting an article | 3 |
| Regenerating a picture | 1 |

If your account doesn't have enough credits, the tool returns an error with the required and available credit counts.

---

## See Also

- [Balzac CLI](https://github.com/hirebalzac/cli) -- Command-line interface
- [API Documentation](https://developer.hirebalzac.ai) -- Full REST API reference

---

## License

MIT
