---
name: balzac-mcp
description: Balzac MCP server gives AI assistants native tool access to the Balzac content platform. Manage workspaces, keywords, suggestions, articles, integrations, and more through structured MCP tool calls instead of CLI commands.
homepage: https://developer.hirebalzac.ai
metadata: {"clawdbot":{"emoji":"✍️","requires":{"env":["BALZAC_API_KEY"]}}}
---

## Setup

Configure your MCP host to run balzac-mcp with your API key:

```json
{
  "mcpServers": {
    "balzac": {
      "command": "npx",
      "args": ["-y", "balzac-mcp"],
      "env": {
        "BALZAC_API_KEY": "bz_your_key_here"
      }
    }
  }
}
```

npm release: https://www.npmjs.com/package/balzac-mcp
github: https://github.com/hirebalzac/mcp
api docs: https://developer.hirebalzac.ai
official website: https://hirebalzac.ai

---

| Property | Value |
|----------|-------|
| **name** | balzac-mcp |
| **description** | MCP server for managing Balzac workspaces, keywords, suggestions, and articles |
| **transport** | stdio (JSON-RPC over stdin/stdout) |
| **auth** | BALZAC_API_KEY environment variable |

---

## Core Workflow

1. **Create workspace** from a domain (Balzac auto-analyzes the site)
2. **Manage keywords** (add, enable/disable)
3. **Generate content** (generate suggestions, accept them, or create briefings)
4. **Manage articles** (list, export, rewrite, publish to integrations)

---

## Tool Reference

### Account

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_account` | (none) | Account, available credits, admin flag (and the person's role for connected apps) |

### Workspaces

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_workspaces` | `status?` (new, running, ready, imported, not_imported), `page?`, `per_page?` | List all workspaces |
| `get_workspace` | `workspace_id` | Get workspace details |
| `create_workspace` | `domain`, `name?`, `language?`, `auto_accept_keywords?`, `auto_accept_suggestions?`, `pictures_style?`, `title_based_featured_image?` (local server only), `brand_color?`, `title_font?`, `max_articles_per_period?`, `max_articles_period?` | Create workspace from domain (422 `plan_limit_reached` at the plan's website limit). Setup then sets its own name, language, cover settings and article limits |
| `update_workspace` | `workspace_id`, `name?`, `description?`, `language?`, `pictures_style?`, `title_based_featured_image?`, `brand_color?`, `title_font?`, `max_articles_per_period?`, `max_articles_period?` | Update workspace |
| `delete_workspace` | `workspace_id` | Delete workspace (admins only) |

### Keywords

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_keywords` | `workspace_id`, `status?`, `page?`, `per_page?` | List keywords |
| `get_keyword` | `workspace_id`, `keyword_id` | Get keyword details (incl. difficulty and GSC metrics) |
| `create_keyword` | `workspace_id`, `name` | Add a keyword |
| `enable_keyword` | `workspace_id`, `keyword_id` | Enable keyword |
| `disable_keyword` | `workspace_id`, `keyword_id` | Disable keyword |
| `delete_keyword` | `workspace_id`, `keyword_id` | Delete keyword |
| `generate_keywords` | `workspace_id` | Generate new keywords with AI (async) |

### Suggestions

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_suggestions` | `workspace_id`, `status?`, `page?`, `per_page?` | List suggestions |
| `get_suggestion` | `workspace_id`, `suggestion_id` | Get suggestion details |
| `generate_suggestions` | `workspace_id` | Generate 10 new suggestions (1 credit, async) |
| `accept_suggestion` | `workspace_id`, `suggestion_id` | Accept and start writing (5 credits) |
| `reject_suggestion` | `workspace_id`, `suggestion_id` | Reject suggestion |

### Briefings

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_briefings` | `workspace_id`, `status?`, `page?`, `per_page?` | List briefings |
| `get_briefing` | `workspace_id`, `briefing_id` | Get briefing details |
| `create_briefing` | `workspace_id`, `topic`, `title?`, `type_of?`, `length?`, `language?`, `focus_keywords?`, `briefing?`, `tone_of_voice_id?` | Create briefing and write article (5 credits) |

### Articles

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_articles` | `workspace_id`, `status?`, `published?`, `page?`, `per_page?` | List articles, with `live_url`, `rewrites_left`, `new_covers_left` |
| `get_article` | `workspace_id`, `article_id` | Get article details + content (`html_content`, `published_html`, `schema_json_ld`), `live_url`, `publications[]` (with `url`), `rewrites_left`, `new_covers_left` |
| `update_article` | `workspace_id`, `article_id`, `title?`, `slug?`, `description?`, `language?`, `tone_of_voice_id?` | Update metadata |
| `delete_article` | `workspace_id`, `article_id` | Delete article |
| `rewrite_article` | `workspace_id`, `article_id`, `length?`, `language?`, `tone_of_voice_id?`, `additional_instructions?` | Rewrite (free, 2 per article, async); returns the article without its content |
| `regenerate_article_picture` | `workspace_id`, `article_id`, `picture_mode?`, `pictures_style?`, `additional_instructions?` | New cover (free, 2 per article, async). Remote server: `picture_mode` (title or stock) and `additional_instructions?` (stock search words), no AI images |
| `publish_article` | `workspace_id`, `article_id`, `integration_id` | Publish to integration; returns the article (without `html_content`, `published_html`, `schema_json_ld`) and its new publication, or `publish.result` `already_published` with a message when the article is already there |
| `schedule_article` | `workspace_id`, `article_id`, `integration_id`, `scheduled_for` | Schedule publication; returns the article (without `html_content`, `published_html`, `schema_json_ld`) |
| `export_article` | `workspace_id`, `article_id`, `format?` | Export as html/markdown/xml |

### Competitors

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_competitors` | `workspace_id`, `page?`, `per_page?` | List competitors |
| `create_competitor` | `workspace_id`, `name`, `domain` | Add competitor |
| `delete_competitor` | `workspace_id`, `competitor_id` | Remove competitor |

### Links

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_links` | `workspace_id`, `page?`, `per_page?` | List reference links |
| `create_link` | `workspace_id`, `url` | Add reference link |
| `delete_link` | `workspace_id`, `link_id` | Remove link |

### Settings

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_settings` | `workspace_id` | Get workspace settings, including `ai_images` and `cover_mode` (title, stock or ai) |
| `update_settings` | `workspace_id`, `language?`, `article_length?`, `pictures_style?`, `title_based_featured_image?`, `ai_images?` (remote server: `false` only), `brand_color?`, `title_font?`, `max_articles_per_period?`, `max_articles_period?`, `prefered_tone_of_voice_id?`, `auto_accept_suggestions?`, `use_title_cases_in_headings?`, `prefer_active_voice?`, `write_in_first_person?` | Update settings |

### Tones of Voice

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_tones` | (none) | List available tones |
| `get_tone` | `tone_id` | Get tone details |

### Integrations

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_integrations` | `workspace_id`, `page?`, `per_page?` | List integrations |
| `get_integration` | `workspace_id`, `integration_id` | Get integration details (credentials are never returned) |
| `create_integration` | `workspace_id`, `service`, `name`, `auto_publish?`, + service-specific fields | Create integration (admins only) |
| `update_integration` | `workspace_id`, `integration_id`, `name?`, `auto_publish?`, + service-specific fields | Update integration (admins only) |
| `delete_integration` | `workspace_id`, `integration_id` | Delete integration (admins only) |
| `reconnect_integration` | `workspace_id`, `integration_id` | Re-test connection (admins only) |

**Service-specific fields for create/update_integration:**

- **wordpress**: `wordpress_url`, `wordpress_username`, `wordpress_application_password`
- **webflow**: `webflow_api_token`, `webflow_site_id`, `webflow_collection_id`, `webflow_publication_status`
- **wix**: `wix_api_key`, `wix_site_id`, `wix_member_id`
- **gohighlevel**: `gohighlevel_api_token`, `gohighlevel_location_id`, `gohighlevel_blog_id`, `gohighlevel_author_id`, `gohighlevel_category_id`, `gohighlevel_publication_status`
- **webhook**: `webhook_url`, `webhook_bearer_token`, `webhook_updates` (send `article.updated` when a published article changes: on by default for new webhooks, off for those connected before updates existed; `false` for an endpoint that creates a post on every call)

Credentials are write-only. When `update_integration` moves `wordpress_url` to another site, send `wordpress_application_password` in the same call; when it changes `webhook_url` on an integration with a bearer token, send `webhook_bearer_token`. Otherwise the update fails with `422 validation_failed`.

---

## Credit Costs

| Action | Credits |
|--------|---------|
| Write article (accept_suggestion / create_briefing) | 5 |
| Generate 10 new suggestions | 1 |

Insufficient credits returns an error with `required` and `available` counts. `get_account` shows the credits left.

`rewrite_article` and `regenerate_article_picture` are free: 2 rewrites and 2 new covers per article, and `get_article` shows `rewrites_left` and `new_covers_left`. Another one while one runs returns `409 conflict`; once the 2 are used, `422 free_limit_reached`. An unknown `pictures_style` returns `422 validation_failed` with the valid styles. On the remote server, a stock cover with no matching photo returns `422 no_stock_photo` (retry with search words in `additional_instructions`, or use `title`). With `ai_images: false` in the settings, no cover of the workspace uses AI images: title covers go on a gradient of the brand color and other covers are stock photos. On the remote server, content created through the connector never gets AI images (workspaces it creates start with `ai_images: false`, and its articles keep AI out of their covers), and `title_based_featured_image` and `ai_images` can only be set to `false` (turning `ai_images` on there returns `403 forbidden`, as does turning `auto_accept_suggestions` on in a workspace with `ai_images: true` unless the same call sends `ai_images: false`). On the local server, new articles' covers follow the workspace's settings, which use AI images by default.

---

## Roles and Errors

Only admins can manage integrations and delete workspaces; members get `403 forbidden` there, and can still list integrations and publish to them. API keys count as admin.

Tool errors start with the status and error type, e.g. `[422 free_limit_reached] You've used the 2 free rewrites for this article.`

---

## Async Operations

These tools start background jobs and return immediately:

- `generate_keywords` -- poll `list_keywords` for new results
- `generate_suggestions` -- poll `list_suggestions` for new results
- `create_briefing` / `accept_suggestion` -- poll `list_articles` or `get_article` for status
- `rewrite_article` -- poll `get_article` until `rewriting` is false (give up after a timeout)
- `regenerate_article_picture` -- poll `get_article` for new `main_picture_url`
- `publish_article` -- poll `get_article` for `live_url` (drafts and webhooks without a URL never get one)
- `reconnect_integration` -- poll `get_integration` for status change

Typical polling interval: 5-10 seconds. Article writing takes 2-5 minutes.

---

## Example Patterns

### Full content pipeline

```
1. create_workspace { domain: "myblog.com" }
2. (wait for status "ready" or "imported")
3. list_keywords { workspace_id }
4. generate_suggestions { workspace_id }
5. (wait ~30s)
6. list_suggestions { workspace_id, status: "proposed" }
7. accept_suggestion { workspace_id, suggestion_id }
8. (wait 2-5 min)
9. get_article { workspace_id, article_id }
10. publish_article { workspace_id, article_id, integration_id }
```

### Direct article writing

```
1. create_briefing { workspace_id, topic: "How to improve SEO rankings" }
2. (wait 2-5 min)
3. list_articles { workspace_id, status: "done" }
4. export_article { workspace_id, article_id, format: "markdown" }
```

### Set up webhook integration

```
1. create_integration {
     workspace_id,
     service: "webhook",
     name: "My App",
     webhook_url: "https://example.com/balzac-hook",
     webhook_bearer_token: "secret",
     auto_publish: true
   }
2. get_integration { workspace_id, integration_id }  -- check status
```

---

## For AI Agents

Agent skill (Claude Code, Cursor, OpenClaw, etc.):

```
npx skills add hirebalzac/mcp
```
