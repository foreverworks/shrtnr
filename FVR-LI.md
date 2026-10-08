# fvr.li: the Forever Works deployment of shrtnr

This fork of [`oddbit/shrtnr`](https://github.com/oddbit/shrtnr) runs Forever Works' short links on
`fvr.li`. Everything else in this repository is upstream's and keeps upstream's license, notice and
trademark policy: this deployment is not the official release and is not affiliated with Oddbit.
The fork changes as little as it can, so an upstream release merges cleanly.

## What differs from upstream

| change | where | why |
|---|---|---|
| `HOME_URL` secret: a signed-out `/` answers a 302 there | `src/index.tsx`, `src/types.ts`, `src/__tests__/handler/home-url.test.ts` | the bare short domain leads to the company site |
| route `fvr.li/*`, `workers_dev: false` | `wrangler.jsonc` | one hostname for links and admin |

The D1 database and KV namespace carry no ids here, as upstream intends: a deploy inherits the
bindings of the Worker already deployed.

## Admin and MCP

- **Admin:** `https://fvr.li/_/admin`, behind a Cloudflare Access application on `fvr.li/_/admin`.
- **MCP:** `https://mcp.fvr.li` (Streamable HTTP), behind a second Access application with Managed
  OAuth and dynamic client registration. In claude.ai: Settings, Connectors, Add custom connector,
  URL `https://mcp.fvr.li`. In Claude Code: `claude mcp add --transport http fvr-li https://mcp.fvr.li`.
- Both admit the emails in their Access policy; links belong to the email that created them.

## Sharing the zone

A second Worker, `guest-start` from `foreverworks/shorturl`, owns `fvr.li/start/*`. Cloudflare
picks the most specific route, so this Worker serves everything else on the zone.

## Rules for links on fvr.li

- **A link whose target carries a secret needs a long system slug** (`slug_length: 32`). Every link
  gets a system slug that cannot be removed, and the default length of 3 is enumerable.
- **Disable, never delete, a published link.** shrtnr refuses to delete a clicked link anyway.

## Updating from upstream

    git fetch upstream && git merge upstream/main
    npx yarn@1.22.22 install --frozen-lockfile && npx yarn@1.22.22 types && npx yarn@1.22.22 test

Then deploy with `npx wrangler deploy` and check that the published slugs still redirect.
Upstream's own workflows (releases, SDK publishing) are not enabled in this fork.
