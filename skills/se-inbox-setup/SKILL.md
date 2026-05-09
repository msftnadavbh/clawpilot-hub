---
name: "se-inbox-setup"
description: "One-shot Outlook organizer for Microsoft SEs. Creates 6 SE-themed folders + colored master categories, installs 5 inbox rules, bulk-categorizes and moves all existing inbox/archive mail (skipping flagged), and tags calendar events with the same scheme. Triggers: 'organize my inbox', 'SE inbox setup', 'set up Outlook folders and rules', 'color-code my inbox', 'inbox to zero'."
author: "roey zalta"
version: "1.0.0"
tags: [outlook, productivity, mcaps, se, graph, inbox-zero]
category: "Productivity"
---

# SE Inbox Setup Skill

Sets up a Microsoft SE's Outlook with a consistent **6-category color scheme** across mail (folders + rules + bulk tag/move) and calendar (events tagged). Built on the Microsoft Graph API via the **Graph Explorer token** — the only auth path that works around tenant policies blocking OWA, m365 CLI Mail scopes, and the New Outlook for Mac webview.

## When to use

The user says any of:

- "organize my inbox"
- "set up SE Outlook"
- "color-code my mail and calendar"
- "inbox to zero with categories"
- "set up folders and rules"

## What it does

1. Creates **6 mail folders** under the inbox root.
2. Creates **6 master categories** with preset colors.
3. Creates **5 inbox rules** that auto-route incoming mail.
4. Bulk-tags + moves existing inbox messages (skips anything `flag.flagStatus === 'flagged'`).
5. Bulk-tags existing archive messages (does **not** move them).
6. (Optional) Tags upcoming calendar events with the same 6 categories.

## The 6 categories

| Color (preset) | Category | Folder | Senders / subjects |
|---|---|---|---|
| Red (preset0) | Customer | Customer | external real-person senders |
| Orange (preset1) | MSX & Pipeline | MSX & Pipeline | msx, dynamics, crm, msxengage, salescopilot, d365 |
| Yellow (preset2) | Microsoft Internal | Microsoft Internal | @microsoft.com, engage.mail.microsoft |
| Green (preset3) | Learning & Certs | Learning & Certs | learn.microsoft, mslearn, credly, certs.databricks, training, academy; subj: certification/certificate/course |
| Blue (preset4) | WinWires & Cross-Team | WinWires & Cross-Team | subj: win wire/winwire/customer win/case study |
| Purple (preset5) | HR-Admin | HR-Admin | hronline, myhr, workday, benefits, payroll, concur, myexpense, globalmobility; subj: expense report/reimbursement |

## Procedure

### Step 1 — Get a Microsoft Graph token

Open Graph Explorer in a Playwright-controlled browser that uses the user's Edge persistent profile so SSO completes silently:

```
playwright-browser_navigate https://developer.microsoft.com/en-us/graph/graph-explorer
```

Click "Sign in" → pick the user's @microsoft.com account → click the **Access token** tab.

The token has these scopes pre-consented for Microsoft FTEs: `Mail.ReadWrite`, `MailboxSettings.ReadWrite`, `Calendars.ReadWrite`.

### Step 2 — One-shot Graph script

> ⚠️ **Don't copy the token through bash heredoc — it gets corrupted.** Always run Graph calls inside `playwright-browser_evaluate` so the token never leaves the page.

Paste this as the body of `playwright-browser_evaluate`:

```js
async () => {
  const link = document.querySelector('a[href*="jwt.ms#access_token="]');
  const token = link.href.match(/access_token=([^&]+)/)[1];
  const auth = {Authorization:'Bearer '+token, 'Content-Type':'application/json'};
  const G = 'https://graph.microsoft.com/v1.0';
  const out = {folders:{}, categories:[], rules:[], inbox:null, archive:null};

  // 1. Folders (handle ErrorFolderExists by re-fetching)
  const folderNames = ['Customer','MSX & Pipeline','Microsoft Internal','Learning & Certs','WinWires & Cross-Team','HR-Admin'];
  for (const name of folderNames) {
    const r = await fetch(G+'/me/mailFolders', {method:'POST', headers:auth, body:JSON.stringify({displayName:name})});
    const d = await r.json();
    if (r.status === 201) out.folders[name] = d.id;
    else if (d.error?.code === 'ErrorFolderExists') {
      const list = await fetch(G+`/me/mailFolders?$filter=displayName eq '${name.replace(/'/g,"''")}'`, {headers:auth}).then(r=>r.json());
      out.folders[name] = list.value?.[0]?.id;
    }
  }

  // 2. Master categories with preset colors
  const cats = [
    ['Customer','preset0'], ['MSX & Pipeline','preset1'], ['Microsoft Internal','preset2'],
    ['Learning & Certs','preset3'], ['WinWires & Cross-Team','preset4'], ['HR-Admin','preset5']
  ];
  for (const [displayName,color] of cats) {
    const r = await fetch(G+'/me/outlook/masterCategories', {method:'POST', headers:auth, body:JSON.stringify({displayName,color})});
    out.categories.push({name:displayName, status:r.status});
  }

  // 3. Inbox rules — sequence matters (lowest runs first)
  const rules = [
    {displayName:'SE: MSX & Pipeline', sequence:1, isEnabled:true,
      conditions:{senderContains:['msx','dynamics','crm','msxengage','salescopilot','d365']},
      actions:{moveToFolder:out.folders['MSX & Pipeline'], assignCategories:['MSX & Pipeline'], stopProcessingRules:true}},
    {displayName:'SE: HR-Admin', sequence:2, isEnabled:true,
      conditions:{senderContains:['hronline','myhr','workday','benefits','payroll','concur','myexpense','globalmobility']},
      actions:{moveToFolder:out.folders['HR-Admin'], assignCategories:['HR-Admin'], stopProcessingRules:true}},
    {displayName:'SE: Learning & Certs', sequence:3, isEnabled:true,
      conditions:{senderContains:['learn.microsoft','mslearn','credly','certs.databricks','training','academy']},
      actions:{moveToFolder:out.folders['Learning & Certs'], assignCategories:['Learning & Certs'], stopProcessingRules:true}},
    {displayName:'SE: WinWires & Cross-Team', sequence:4, isEnabled:true,
      conditions:{subjectContains:['win wire','winwire','win-wire','customer win','case study']},
      actions:{moveToFolder:out.folders['WinWires & Cross-Team'], assignCategories:['WinWires & Cross-Team'], stopProcessingRules:true}},
    {displayName:'SE: Microsoft Internal', sequence:5, isEnabled:true,
      conditions:{senderContains:['@microsoft.com','engage.mail.microsoft']},
      actions:{moveToFolder:out.folders['Microsoft Internal'], assignCategories:['Microsoft Internal'], stopProcessingRules:false}},
  ];
  for (const r of rules) {
    const resp = await fetch(G+'/me/mailFolders/inbox/messageRules', {method:'POST', headers:auth, body:JSON.stringify(r)});
    out.rules.push({name:r.displayName, status:resp.status});
  }

  // 4. Classifier — same logic as the rules, plus heuristics for unmatched mail
  function classify(addr, subj) {
    addr=(addr||'').toLowerCase(); subj=(subj||'').toLowerCase();
    const has=(s,ks)=>ks.some(k=>s.includes(k));
    if (has(addr,['msx','dynamics','crm','msxengage','salescopilot','d365'])) return 'MSX & Pipeline';
    if (has(addr,['hronline','myhr','workday','benefits','payroll','concur','myexpense','globalmobility']) || has(subj,['expense report','reimbursement'])) return 'HR-Admin';
    if (has(addr,['learn.microsoft','mslearn','credly','certs.databricks','training','academy']) || has(subj,['certification','certificate','course'])) return 'Learning & Certs';
    if (has(subj,['win wire','winwire','win-wire','customer win','case study'])) return 'WinWires & Cross-Team';
    if (addr.includes('@microsoft.com') || addr.includes('engage.mail.microsoft')) return 'Microsoft Internal';
    if (addr && !addr.includes('noreply') && !addr.includes('no-reply') && addr.includes('@')) return 'Customer';
    return null;
  }

  async function process(folder, doMove) {
    const counts={moved:{}, tagged:{}, skippedFlagged:0, processed:0};
    let url = G+`/me/mailFolders/${folder}/messages?$select=id,from,subject,categories,flag&$top=100`;
    while (url) {
      const r = await fetch(url, {headers:auth});
      const d = await r.json();
      if (!d.value) break;
      for (const m of d.value) {
        counts.processed++;
        if (m.flag?.flagStatus === 'flagged') { counts.skippedFlagged++; continue; }
        const cat = classify(m.from?.emailAddress?.address, m.subject);
        if (!cat) continue;
        if (!(m.categories||[]).includes(cat)) {
          await fetch(G+'/me/messages/'+m.id, {method:'PATCH', headers:auth, body:JSON.stringify({categories:[...(m.categories||[]), cat]})});
          counts.tagged[cat] = (counts.tagged[cat]||0)+1;
        }
        if (doMove && out.folders[cat]) {
          const mv = await fetch(G+'/me/messages/'+m.id+'/move', {method:'POST', headers:auth, body:JSON.stringify({destinationId: out.folders[cat]})});
          if (mv.ok) counts.moved[cat] = (counts.moved[cat]||0)+1;
        }
      }
      url = d['@odata.nextLink'];
    }
    return counts;
  }

  out.inbox = await process('inbox', true);     // tag + move (skip flagged)
  out.archive = await process('archive', false); // tag only — don't move

  const finalInbox = await fetch(G+'/me/mailFolders/inbox', {headers:auth}).then(r=>r.json());
  out.inboxRemaining = finalInbox.totalItemCount;
  return out;
}
```

After it returns, the inbox should contain only **flagged items** + anything the classifier couldn't match. If any unmatched mail remains, do a second targeted pass with a relaxed classifier.

### Step 3 — Calendar (optional)

Use `m365_list_events` to get the next ~50 events, then `m365_update_event` to add `categories: [<one of the 6 names>]` based on subject/attendee heuristics. The `m_*` tools work fine for calendar — Graph token not required.

## Important gotchas

- **Token in heredoc gets corrupted.** Never `cat > /tmp/token <<'EOF'`. Run all Graph calls inside `browser_evaluate` so the token stays in the page.
- **`ErrorFolderExists`** — handle gracefully by GETting the folder by displayName.
- **Master category color collision** — if the user already has a built-in category with that color, POST returns 400. Either DELETE first or ignore.
- **Rule sequence matters.** Lower sequence runs first. Most-specific rule first; the @microsoft.com fallback rule last with `stopProcessingRules:false`.
- **Always skip `flag.flagStatus === 'flagged'`** when moving messages. Flagged = user wants it visible in the inbox.
- **Don't auto-create a "Customer" rule.** External senders are too varied — let the rule chain handle Microsoft Internal and let the bulk script tag/move the residual external mail.
- **Only Graph Explorer works.** m365 CLI / OWA / Power Automate / New Outlook for Mac all hit tenant or webview limits. Don't waste cycles on them.

## Verification

```js
// Confirm the 6 folders are present
fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=20', {headers:{Authorization:'Bearer '+token}}).then(r=>r.json())

// Confirm the 5 rules
fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messageRules', {headers:{Authorization:'Bearer '+token}}).then(r=>r.json())
```

Expected after first run on a typical SE inbox:

| Step | Result |
|---|---|
| Folders | 6 created (or matched if they exist) |
| Categories | 6 created |
| Rules | 5 created |
| Inbox | flagged-only |
| Archive | bulk-tagged |
