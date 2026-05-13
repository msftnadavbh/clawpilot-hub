// Cowork Ghost - content script
// Runs on m365.cloud.microsoft/chat*. If a pending prompt exists for this tab,
// navigate to Cowork (via sidebar click), wait for the chat input, type, submit, verify.

(async () => {
  const tabId = await getTabId();
  if (!tabId) return;
  const key = "pending_" + tabId;
  const stored = await chrome.storage.session.get(key);
  const prompt = stored[key];
  if (!prompt) return;
  await chrome.storage.session.remove(key);

  log("awake; prompt:", prompt);

  // 1. Make sure we land on the Cowork agent URL.
  //    Direct navigation to /chat/agent/T_xxx breaks React; only SPA-style
  //    navigation via the Cowork sidebar button works reliably.
  const onAgent = await ensureOnCowork(45000);
  if (!onAgent) {
    log("could not navigate to Cowork agent");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: false, reason: "could not open Cowork", prompt });
    return;
  }
  log("on Cowork agent");

  // 2. Wait for chat input
  const input = await waitForChatInput(60000);
  if (!input) {
    log("chat input not found");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: false, reason: "input not found", prompt });
    return;
  }
  log("found input");

  // 3. Type
  input.focus(); input.click();
  await sleep(300);
  const typed = await typeInto(input, prompt);
  log("typed via", typed);
  await sleep(700);

  // 4. Submit (Enter, then Send button fallback)
  fireEnter(input);
  await sleep(2500);
  let landed = await verifyLanded(prompt);
  if (!landed) {
    const btn = findSendButton();
    if (btn) {
      log("clicking Send button fallback");
      btn.click();
      await sleep(2500);
      landed = await verifyLanded(prompt);
    }
  }

  if (landed) {
    log("LANDED");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: true, prompt });
  } else {
    log("submit not confirmed");
    chrome.runtime.sendMessage({ type: "fire-result", tabId, ok: false, reason: "submit not confirmed", prompt });
  }

  await sleep(3000);
  chrome.runtime.sendMessage({ type: "close-self", tabId });
})();

function log(...args) { try { console.log("[CoworkGhost]", ...args); } catch(_){} }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "who-am-i" }, (resp) => resolve(resp && resp.tabId));
  });
}

async function ensureOnCowork(timeoutMs) {
  // If URL already contains /agent/T_, we're set
  if (location.href.includes("/agent/T_")) return true;
  // Else click the Cowork button in the sidebar
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const btn = Array.from(document.querySelectorAll("button"))
      .find(b => (b.textContent || "").trim() === "Cowork");
    if (btn) {
      log("clicking Cowork sidebar button");
      btn.click();
      // Wait for URL change
      const navDeadline = Date.now() + 15000;
      while (Date.now() < navDeadline) {
        if (location.href.includes("/agent/T_")) {
          await sleep(2000); // settle
          return true;
        }
        await sleep(300);
      }
      return false;
    }
    await sleep(400);
  }
  return false;
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
    const visible = candidates.find(isVisible);
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

async function typeInto(el, text) {
  try {
    const ok = document.execCommand("insertText", false, text);
    if (ok && (el.textContent || "").includes(text)) return "execCommand";
  } catch (_) {}
  try {
    el.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true, cancelable: true }));
    if (!(el.textContent || "").includes(text)) el.textContent = text;
    el.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: text, bubbles: true }));
    if ((el.textContent || "").includes(text)) return "InputEvent";
  } catch (_) {}
  el.textContent = text;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return "textContent";
}

function fireEnter(el) {
  for (const type of ["keydown", "keypress", "keyup"]) {
    el.dispatchEvent(new KeyboardEvent(type, {
      key: "Enter", code: "Enter", keyCode: 13, which: 13,
      bubbles: true, cancelable: true,
    }));
  }
}

function findSendButton() {
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  let btn = buttons.find(b => /^(send|submit)$/i.test((b.textContent || "").trim()) && !b.disabled);
  if (btn) return btn;
  btn = buttons.find(b => /^(send|submit|send message)$/i.test(b.getAttribute("aria-label") || ""));
  return btn || null;
}

async function verifyLanded(prompt) {
  const tail = prompt.slice(-25).trim();
  const containers = document.querySelectorAll('[role="feed"], [role="log"], main');
  for (const c of containers) {
    if ((c.textContent || "").includes(tail)) return true;
  }
  if (location.hash && location.hash.startsWith("#/task")) return true;
  if (location.href.includes("/task/")) return true;
  return false;
}
