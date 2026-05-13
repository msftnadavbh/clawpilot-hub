---
name: "cowork-ghost"
description: "Silently use Microsoft 365 Copilot Cowork at random moments through the workday so it looks like the user is actively coworking with Copilot. Picks safe, read-only prompts (catch-up, summarize, research, draft) from a generic MCAPS-friendly pool. Schedule it as an automation across the workday."
author: "roey zalta"
version: "1.0.0"
tags: [cowork, copilot, m365, automation, playwright, mcaps]
category: "Productivity"
---

# cowork-ghost

## What this skill does
Opens Microsoft 365 Copilot Cowork in the browser, types one randomly chosen, generic, read-only prompt into the chat input, sends it, and leaves. Cowork then runs autonomously in the background — no human needs to be present.

The goal is to make it look like the user is naturally using Cowork throughout their workday (≥5 prompts/day at irregular times).

## Hard rules
1. **Read-only prompts only.** Never invoke this skill with a prompt that sends email, schedules meetings, posts in Teams, or modifies anything. The pool in `prompts.json` is curated to be safe; do not deviate.
2. **No personal data in prompts.** Prompts must be generic enough to make sense for any MCAPS Israel employee (sellers, SEs, CSAs, managers). No names, no specific customers, no specific projects.
3. **One prompt per invocation.** Send and leave.
4. **Never approve actions on the user's behalf.** If Cowork pauses asking for approval, just close the page. Do not click any "Send", "Post", "Schedule", or "Confirm" buttons.
5. **No screenshots, no transcripts saved.** Cowork's response may contain private user data — do not capture it.

## Execution flow

### Step 1 — Decide whether to fire and pick a prompt
Run the picker:

```bash
python3 ~/.copilot/m-skills/cowork-ghost/scripts/pick_prompt.py
```

Output is JSON:
```json
{"should_fire": true, "prompt": "...", "reason": "...", "today_count": 3, "today_target_min": 5}
```

If `should_fire` is `false`, **stop here**. Print a one-line message like `Cowork ghost: skipped this tick (today 2/5).` and exit. Do not open the browser.

If `should_fire` is `true`, continue.

### Step 2 — Add a tiny human-like delay (optional)
To break minute-level alignment with the schedule, sleep a random 30–600 seconds before opening the browser:

```bash
python3 -c "import random,time; t=random.randint(30,600); print(f'Sleeping {t}s'); time.sleep(t)"
```

### Step 3 — Open Cowork in the browser
Use Playwright MCP tools. Validated flow (May 2026):

1. `playwright-browser_navigate` to `https://m365.cloud.microsoft/`. Wait ~15s — the SPA is heavy and snapshot-after-load is unreliable for the deep-link `?titleId=...` URL.
2. `playwright-browser_snapshot`. You should see the navigation sidebar with agents (Researcher, Analyst, Sales, Cowork, …) and a "Message Copilot" textbox.
3. Click the Cowork agent. The accessible-tree button shares its label with a Pin button on hover, so prefer this JS-based click which targets the button whose text is exactly "Cowork":
   ```
   playwright-browser_evaluate function:
     "() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Cowork'); if (!b) return 'NOT FOUND'; b.click(); return 'OK'; }"
   ```
   Wait 6 seconds. The URL should change to `https://m365.cloud.microsoft/chat/agent/T_7e151bfa-7eaa-0802-049f-5d3b98c95e04.weave` and the page title to `Cowork | M365 Copilot`. The chat input now has accessible name **"Chat input"** (not "Message Copilot").
4. `playwright-browser_snapshot` to get a fresh ref for the chat input. `playwright-browser_type` the chosen prompt with `submit: true`.
   - Fallback: if Enter doesn't submit, snapshot again and click the **Send** button.
5. Wait 6 seconds. Snapshot once and confirm one of these signals appeared (just to verify it actually fired — do not capture the content):
   - URL contains `#/task/`
   - Breadcrumb has a "Cowork" → task-name structure
   - Chat log contains an article starting "You said: …"
   - A "Stop" button is visible
6. **Do not** read the response. **Do not** screenshot. `playwright-browser_close`.

### Step 4 — Report
Print exactly one short line, e.g.:
`Cowork ghost: fired prompt #4/5 today — "Catch me up on what I missed today."`

Do not announce the response content. Do not call `m_send_teams_message` for these — they're meant to be silent.

## Failure handling
- **Not signed in / SSO redirect to login:** Close the browser, print `Cowork ghost: not signed in to M365, skipping.`, and exit. Do not try to auto-sign-in (that would surface a window to the user mid-day).
- **Cowork unavailable / page errors / "Service is busy":** Close, print `Cowork ghost: Cowork unavailable, skipping.`, and exit.
- **Chat input not found after 2 snapshots:** Close, print `Cowork ghost: input not found, skipping.`, and exit.

In any failure case, **do not** decrement the state counter — we'll catch up next tick. (Actually, to avoid overcounting failed attempts, after Step 1 you may re-edit `state.json` to subtract the increment if you want to be exact; but it's optional and not required.)

## Manual triggers (user-invoked)
- `"fire a cowork ping now"` / `"test cowork ghost"` → run Step 3–4 only, with a prompt picked directly via Python (skip the probability gate):
  ```bash
  python3 -c "import json,random; p=json.load(open('$HOME/.copilot/m-skills/cowork-ghost/prompts.json'))['prompts']; print(random.choice(p))"
  ```
- `"show today's cowork ghost activity"` → `cat ~/.copilot/m-skills/cowork-ghost/state.json | python3 -m json.tool`
- `"add a cowork prompt: <text>"` → append to `prompts.json` after confirming it's read-only.

## Files
- `~/.copilot/m-skills/cowork-ghost/SKILL.md` — this file
- `~/.copilot/m-skills/cowork-ghost/prompts.json` — the prompt pool (edit freely)
- `~/.copilot/m-skills/cowork-ghost/scripts/pick_prompt.py` — fire decision + picker
- `~/.copilot/m-skills/cowork-ghost/state.json` — created at runtime, last 14 days of fire history

## Sharing with other MCAPS Israel folks
This skill is intentionally generic. To share:
1. Zip the `cowork-ghost/` folder.
2. Recipient drops it into `~/.copilot/m-skills/cowork-ghost/` on their machine.
3. Recipient creates the same automation (see prompt below).
4. They must already be signed in to M365 in the Playwright browser profile.

Automation prompt (recipient creates via Clawpilot self-control):
> Schedule: every weekday at 8:15am, 9:40am, 11:05am, 12:50pm, 2:25pm, 3:55pm, 5:30pm, 7:10pm
> Prompt: "Run the /cowork-ghost skill. Decide whether to fire, and if so, send one random read-only prompt into Cowork. Stay silent unless something fails."
