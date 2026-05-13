// Cowork  content scriptGhost 
// Runs on the Cowork agent page. Picks up the pending prompt from session storage,
// types it into the Chat input, submits, and reports success.

(async () => {
  const tabId = await getTabId();
  if (!tabId) return;
  const key = `pending_${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const prompt = stored[key];
  if (!prompt) return; // not a ghost-fired tab
  await chrome.storage.session.remove(key);

  console.log("[CoworkGhost] content script awake; prompt:", prompt);

  const input = await waitForChatInput(60000);
  if (!input) {
    console.warn("[CoworkGhost] chat input not found after 60s");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: false, reason: "input not found", prompt });
    return;
  }
  console.log("[CoworkGhost] found input, typing");

  // Focus and click first to make sure framework registers active state
  input.focus();
  input.click();
  await sleep(200);

  const typed = await typeIntoContentEditable(input, prompt);
  console.log("[CoworkGhost] typed via:", typed);
  await sleep(600);

  // Try Enter first
  fireKey(input, "Enter");
  await sleep(2000);

  let landed = await verifyLanded(prompt);
  if (!landed) {
    // Fallback: click Send/Submit button
    const btn = findSendButton();
    if (btn) {
      console.log("[CoworkGhost] clicking send fallback");
      btn.click();
      await sleep(2000);
      landed = await verifyLanded(prompt);
    }
  }

  if (landed) {
    console.log("[CoworkGhost] confirmed landed");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: true, prompt });
  } else {
    console.warn("[CoworkGhost] could not confirm submission");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: false, reason: "submit not confirmed", prompt });
  }

  await sleep(3000);
  chrome.runtime.sendMessage({ type: "close-self", tabId });
})();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "who-am-i" }, (resp) => {
      resolve(resp?.tabId);
    });
  });
}

async function waitForChatInput(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const candidates = [
      ...document.querySelectorAll('[aria-label="Chat input"]'),
      ...document.querySelectorAll('[aria-label="Message Copilot"]'),
      ...document.querySelectorAll('div[contenteditable="true"][role="textbox"]'),
      ...document.querySelectorAll('div[contenteditable="true"]'),
    ];
    const visible = candidates.find(el => isVisible(el));
    if (visible) return visible;
    await sleep(500);
  }
  return null;
}

function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && el.offsetParent !== null;
}

async function typeIntoContentEditable(el, text) {
  // Method 1: execCommand insertText (works in most contenteditable cases incl. Fluent)
  try {
    const ok = document.execCommand("insertText", false, text);
    if (ok && (el.textContent || "").includes(text)) return "execCommand";
  } catch (_) {}

  // Method 2: InputEvent insertText (modern path, React/Lexical/ProseMirror often listen for this)
  try {
    el.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
    if (!(el.textContent || "").includes(text)) {
      el.textContent = text;
    }
    el.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: text, bubbles: true }));
    if ((el.textContent || "").includes(text)) return "InputEvent";
  } catch (_) {}

  // Method 3: brute set + input event
  el.textContent = text;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return "textContent";
}

function fireKey(el, key) {
  for (const type of ["keydown", "keypress", "keyup"]) {
    el.dispatchEvent(new KeyboardEvent(type, {
      key, code: key, keyCode: key === "Enter" ? 13 : 0, which: key === "Enter" ? 13 : 0,
      bubbles: true, cancelable: true,
    }));
  }
}

function findSendButton() {
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  // Prefer exact label
  let btn = buttons.find(b => /^(send|submit)$/i.test((b.textContent || "").trim()) && !b.disabled);
  if (btn) return btn;
  // aria-label
  btn = buttons.find(b => /^(send|submit|send message)$/i.test(b.getAttribute("aria-label") || ""));
  return btn || null;
}

async function verifyLanded(prompt) {
  // After submit, the URL changes to /chat/agent/.../#/task/... AND a "You said" / user message bubble appears
  const tail = prompt.slice(-25).trim();
  // Look for the prompt text echoed back in feed/log
  const containers = document.querySelectorAll('[role="feed"], [role="log"], main');
  for (const c of containers) {
    if ((c.textContent || "").includes(tail)) return true;
  }
  // URL hash change is also a strong signal
  if (location.hash && location.hash.startsWith("#/task")) return true;
  if (location.href.includes("/task/")) return true;
  return false;
}
