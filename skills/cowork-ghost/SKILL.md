---
name: "cowork-ghost"
description: "Edge browser extension that silently fires safe, read-only prompts into M365 Copilot Cowork at random workday moments. Install once, runs forever in the background using your existing M365 sign-in. No terminal, no Playwright, no setup."
author: "MCAPS Israel"
version: "1.0.0"
tags: [cowork, copilot, m365, edge-extension, automation, mcaps]
category: "Productivity"
---

# Cowork Ghost

A tiny Microsoft Edge extension that makes you look like an active M365 Copilot Cowork user — without you having to think about it. It opens Cowork in a background tab a few times a day during work hours, fires one of ~30 safe read-only prompts, and closes the tab. You stay focused on your real work.

## Why

If your team is being measured on Cowork adoption / engagement, this gets you to ≥5 daily prompts without you actually having to remember to open Cowork. The prompts are all read-only (catch-up, summarize, research, draft) — nothing is sent, scheduled, or posted on your behalf.

## Install (1 minute, no terminal)

1. Download the extension:
   - **[cowork-ghost-extension-v1.4.0.zip](./cowork-ghost-extension-v1.4.0.zip)** (or browse the [extension/](./extension/) folder and clone it)
2. Unzip it somewhere you won't accidentally delete (e.g. `~/Documents/cowork-ghost-extension/`).
3. Open Microsoft Edge.
4. Navigate to `edge://extensions/`.
5. Toggle **Developer mode** ON (top-right).
6. Click **Load unpacked** and select the unzipped folder.
7. Pin the **Cowork Ghost** icon to your toolbar.

That's it. The extension is now active. As long as Edge is open during your workday, it will fire ~5 prompts spread across 8am–7pm (Sun–Thu).

## How it works

- **Trigger:** Every 30 minutes during work hours, a probability gate (28%) decides whether to fire. End-of-day catch-up logic ensures you reliably hit your daily target.
- **Authentication:** Uses your existing Edge M365 sign-in. No separate auth.
- **Visibility:** Tabs open in the background (`active: false`), do not steal focus, and auto-close after ~30s.
- **Safety:** Hard-coded to read-only prompts. Never clicks Send/Post/Schedule/Confirm if Cowork pauses.

## Customize

- **Toggle on/off:** Click the toolbar icon → flip the switch.
- **Manual fire:** Click "Fire one now" in the popup.
- **Edit the prompt pool:** Modify `extension/prompts.json` and reload the extension at `edge://extensions/`.
- **Change daily target / probability / work hours:** Edit constants at the top of `extension/background.js`:
  - `DEFAULT_DAILY_TARGET` (default 5)
  - `FIRE_PROBABILITY` (default 0.28)
  - `WORK_HOURS` (default 08:00–19:00, Sun–Thu)

## Hard rules baked into the extension

1. Read-only prompts only. The pool in `prompts.json` is curated. Don't add anything that sends, schedules, or posts.
2. Never approves Cowork action prompts. If Cowork asks for confirmation, the tab is closed without clicking.
3. Never captures Cowork's response. The extension types and leaves.
4. Outside work hours = paused (configurable).

## Files

- `extension/manifest.json` — MV3 extension manifest
- `extension/background.js` — service worker (alarms, probability gate, fire logic)
- `extension/content.js` — runs in the Cowork page; types and submits the prompt
- `extension/popup.html` + `popup.js` — toolbar popup UI
- `extension/prompts.json` — the read-only prompt pool
- `extension/icons/` — toolbar icons
- `cowork-ghost-extension-v1.4.0.zip` — pre-zipped, ready to load unpacked

## Sharing with other MCAPS Israel folks

Send them the link to this skill page. They follow the install steps above. No accounts, no API keys, no Microsoft tickets required.

## Compatibility

- ✅ Microsoft Edge (Chromium-based, MV3)
- ✅ Google Chrome (works, but you must be signed into M365 in Chrome)
- ❌ Safari, Firefox (different extension APIs — would need a port)

## Security note

This extension only runs on `https://m365.cloud.microsoft/*`. It cannot read your other browsing, your email, your files, or your Cowork responses. It just types and submits a prompt from a fixed pool. Inspect the source — it's ~200 lines.

## Legacy: Playwright version

A Playwright-based version of this skill (drives Edge via automation) lived here previously. It's been replaced by the Edge extension because the extension runs entirely in the background without stealing focus and requires no terminal setup. If you need the old version, see the git history.
