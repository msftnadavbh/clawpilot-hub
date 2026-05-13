// Cowork Ghost — content script
// Runs on the Cowork page. Picks up the pending prompt from session storage,
// types it into the Chat input, and submits.

(async () => {
  const tabId = await getTabId();
  if (!tabId) return;
  const key = `pending_${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const prompt = stored[key];
  if (!prompt) return; // not a ghost-fired tab
  await chrome.storage.session.remove(key);

  const input = await waitForChatInput(20000);
  if (!input) {
    console.warn("[CoworkGhost] chat input not found");
    return;
  }

  // Focus, type, submit
  input.focus();
  // Cowork uses a contenteditable rich-text input — simulate typing via beforeinput / input events.
  document.execCommand("insertText", false, prompt);
  // Small delay so the framework registers the change before Enter
  await sleep(400);
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  input.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));

  // Fallback: if Enter didn't submit, click the Send button
  await sleep(1500);
  const log = document.querySelector('[role="feed"], [role="log"]');
  if (!log || !/You said:/i.test(log.textContent || "")) {
    const sendBtn = Array.from(document.querySelectorAll("button"))
      .find(b => b.textContent.trim() === "Send" && !b.disabled);
    if (sendBtn) sendBtn.click();
  }

  // Give the request 5s to leave, then close ourselves
  await sleep(5000);
  // Ask the background to close us (content scripts can't close their own tab)
  chrome.runtime.sendMessage({ type: "close-self", tabId });
})();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getTabId() {
  // Workaround: content scripts don't know their tab id directly.
  // Round-trip via background.
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "who-am-i" }, (resp) => {
      resolve(resp?.tabId);
    });
  });
}

async function waitForChatInput(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Cowork's input has aria-label "Chat input" (or "Message Copilot" before agent loads)
    const candidates = [
      ...document.querySelectorAll('[aria-label="Chat input"]'),
      ...document.querySelectorAll('[aria-label="Message Copilot"]'),
      ...document.querySelectorAll('[role="textbox"]'),
    ];
    const visible = candidates.find(el => el.offsetParent !== null);
    if (visible) return visible;
    await sleep(300);
  }
  return null;
}
