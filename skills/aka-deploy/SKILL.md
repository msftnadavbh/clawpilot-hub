---
name: "aka-deploy"
description: "Deploy a local HTML file or project directory to Vercel production and register the resulting URL as an aka.ms/<vanity> short link. Triggers: 'deploy this and make an aka.ms', 'publish to vercel and shorten', 'ship as aka.ms/<name>', or any combined deploy + aka.ms request."
author: "roey zalta"
version: "1.0.0"
tags: [vercel, aka.ms, deploy, shortlink, microsoft]
category: "Productivity"
---

# aka-deploy

One-shot skill that takes local code (a single `.html` file or a project directory), deploys it to **Vercel** production, then registers the resulting URL as an **aka.ms/&lt;vanity&gt;** short link via the aka.ms Link Management UI.

## When to use
- "Deploy this page and give me an aka.ms link."
- "Publish to vercel and shorten with aka.ms."
- "Ship this site as aka.ms/&lt;name&gt;."
- Anytime a deliverable needs both a public URL and a Microsoft-friendly short link.

## Inputs to confirm with the user
1. **Source path** — local HTML file or project directory.
2. **Vanity name** — the aka.ms slug (letters, numbers, hyphens, underscores, `/`).
3. **Description** — short purpose line (recommended).
4. **Owners** — semicolon-separated aliases. Default to current user; add co-owners if requested.
5. **Category** — optional (e.g. "AI Tour", "Documentation").
6. **Allow parameters** — default OFF unless the user requests it.

## Step 1 — Deploy to Vercel

Use the helper script. It accepts an HTML file OR a directory and deploys to production.

```bash
./scripts/deploy_vercel.sh "<path>" "<project-name>"
```

- For a single `.html` the script wraps it as `index.html` in a temp dir before deploy.
- If the user is not logged into Vercel, run `vercel login` first (interactive — surface the login URL).
- The last stdout line is `DEPLOYED_URL=https://<project>.vercel.app` — parse and reuse.
- Show the user the deployed URL and confirm before creating the aka.ms link.

Prereq: `npm i -g vercel` (CLI 53.x or later).

## Step 2 — Register aka.ms vanity

Drive the aka.ms Link Management SPA via Playwright (the user is already SSO'd against their Microsoft account in the browser profile).

1. Navigate to `https://aka.ms/links?host=1`.
2. Wait ~5s for the SPA (it shows "Checking network access..." briefly).
3. Snapshot to capture refs.
4. Click the **Create** button.
5. Fill the **Create AKA Link** dialog:

   | Field | Required | Notes |
   |---|---|---|
   | Target URL | ✅ | The Vercel URL from Step 1 |
   | Vanity Name | ✅ | Letters, numbers, hyphens, underscores, forward slashes only |
   | Mobile URL |  | Leave blank unless user supplied one |
   | Description |  | One-line purpose |
   | Owners | ✅ | Semicolon-separated aliases |
   | Group Owner |  | Optional |
   | Category |  | Optional |
   | Allow Parameters |  | Toggle — leave OFF by default |

6. Click the dialog's **Create** button. Wait for the dialog to close and the new row to appear in the grid.
7. Verify by opening `https://aka.ms/<vanity>` in a new tab — it should redirect to the Vercel URL.

**Vanity collision:** if the vanity is taken and the user owns it, offer to **Edit** the existing link's Target URL. Otherwise propose a different vanity.

## Step 3 — Report back

Reply with a compact summary:

```
✅ Deployed: https://<project>.vercel.app
🔗 Short link: https://aka.ms/<vanity>
👤 Owners: <list>
```

## Privacy
Never put private user data (calendar, emails, files) into the Description, Vanity, or any aka.ms field — they are org-visible.
