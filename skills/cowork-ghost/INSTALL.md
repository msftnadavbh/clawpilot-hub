# Install Cowork Ghost (Edge extension)

⏱ **2 minutes. No terminal. No admin rights. No code.**

You'll be installing a small Microsoft Edge extension that silently fires safe Copilot Cowork prompts during your workday so you look like an active user — without lifting a finger.

---

## Step 1 — Download the extension

Download the zip:

👉 **[cowork-ghost-extension-v1.3.1.zip](./cowork-ghost-extension-v1.3.1.zip)**

(~12 KB. Save it to your `Downloads` folder.)

---

## Step 2 — Unzip it

Double-click the downloaded zip.

Move the unzipped **`cowork-ghost-extension`** folder somewhere permanent — you must NOT delete it later, because Edge loads it from disk every time it starts.

✅ Recommended location: `~/Documents/cowork-ghost-extension/`
❌ Do not leave it in `Downloads` or `Desktop`.

---

## Step 3 — Open Edge's extensions page

In Microsoft Edge, paste this in the address bar and press Enter:

```
edge://extensions/
```

---

## Step 4 — Turn on Developer mode

Bottom-left of the extensions page, flip the **"Developer mode"** toggle to **ON**.

(This unlocks the "Load unpacked" button. It only affects how YOU install extensions — your colleagues' Edge stays normal.)

---

## Step 5 — Load the extension

Click **"Load unpacked"** (top-left, just appeared).

In the file picker, **select the `cowork-ghost-extension` folder** you unzipped in Step 2.

Click **Select Folder**.

✅ You should now see a card titled **"Cowork Ghost"** in your extensions list, version **1.3.1**.

---

## Step 6 — Pin the icon (optional but recommended)

1. Click the **🧩 puzzle-piece icon** in the Edge toolbar (top right).
2. Find **Cowork Ghost** in the dropdown.
3. Click the **📌 pin icon** next to it.

The Cowork Ghost icon now lives in your toolbar.

---

## Step 7 — Confirm it's working

Click the **Cowork Ghost icon** in your toolbar. The popup should show:

| Field | Expected value |
|---|---|
| Enabled | ✅ ON (green) |
| Today | `0 / 5` (will grow over the day) |
| Work hours | `Yes` (during 8:00–19:00 Sun–Thu, otherwise `No (paused)`) |

To test it immediately, click **"Fire one now"**. Within ~30 seconds, a new task should appear in your Cowork "Recent" list at https://m365.cloud.microsoft/.

---

## Done

That's it. Leave Edge open during your workday — the extension will fire ~5 prompts spread randomly across 8am–7pm.

You'll never see a window pop up. You'll never lose focus. The prompts run silently in an off-screen window.

---

## Troubleshooting

**"I don't see Cowork Ghost after Load unpacked"**
→ You picked the wrong folder. The folder must contain `manifest.json` directly inside it (not one level deeper).

**"Fire one now" shows `Failed: ...`"**
→ Open the popup and check the history list. Each fire is tagged `[OK]` or `[FAIL]` with a reason. If FAIL, common causes: not signed into M365 in Edge, or Cowork URL changed.

**"Today never goes above 0"**
→ Confirm `Enabled` is ON and `Work hours` is `Yes`. Outside work hours the extension is paused. The probability gate is 28% per 30-min tick — it can take 1–2 hours to see the first auto-fire.

**"I see a tiny window briefly flash on screen"**
→ macOS may clamp off-screen windows back inside the visible area. The window is unfocused and closes within ~30s. Open an issue if this is disruptive.

**To temporarily disable**
→ Click the toolbar icon → flip the **Enabled** switch off. State is preserved when you flip it back on.

**To uninstall completely**
→ Go to `edge://extensions/` → find Cowork Ghost → click **Remove**.

---

## Privacy

- Runs only on `https://m365.cloud.microsoft/*`. Cannot read your other tabs, mail, or files.
- Uses your existing Edge sign-in. No accounts, no tokens, no telemetry.
- Reads/writes only Chrome extension storage (local + session) — never the network except the Cowork submission itself.
- Source is ~200 lines. Inspect `extension/background.js` and `extension/content.js`.
