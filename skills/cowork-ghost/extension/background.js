// Cowork  background service workerGhost 
// Schedules randomized workday firings of safe Cowork prompts.

const COWORK_URL = "https://m365.cloud.microsoft/chat/agent/T_7e151bfa-7eaa-0802-049f-5d3b98c95e04.weave";
const TICK_ALARM = "cowork-ghost-tick";
const TICK_INTERVAL_MIN = 30;
const DEFAULT_DAILY_TARGET = 5;
const FIRE_PROBABILITY = 0.28;
const WORK_HOURS = { startH: 8, endH: 19 };

async function loadPrompts() {
  const res = await fetch(chrome.runtime.getURL("prompts.json"));
  const data = await res.json();
  return data.prompts || [];
}

async function getState() {
  const { state } = await chrome.storage.local.get("state");
  return state || { enabled: true, history: {}, dailyTarget: DEFAULT_DAILY_TARGET };
}

async function setState(state) {
  await chrome.storage.local.set({ state });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isWorkHours() {
  const d = new Date();
  const day = d.getDay();
  if (day === 5 || day === 6) return false; // Sat/Fri off (Israel work week)
  const h = d.getHours();
  return h >= WORK_HOURS.startH && h < WORK_HOURS.endH;
}

async function shouldFire(state) {
  if (!state.enabled) return { fire: false, reason: "disabled" };
  if (!isWorkHours()) return { fire: false, reason: "outside work hours" };
  const today = todayKey();
  const todayCount = (state.history[today] || []).filter(e => e.ok !== false).length;
  if (todayCount >= state.dailyTarget) {
    return { fire: false, reason: `target reached (${todayCount}/${state.dailyTarget})` };
  }
  const h = new Date().getHours();
  const hoursLeft = WORK_HOURS.endH - h;
  const stillNeed = state.dailyTarget - todayCount;
  if (hoursLeft <= 2 && stillNeed > 0) {
    return { fire: true, reason: "catch-up (end of day)" };
  }
  const roll = Math.random();
  if (roll < FIRE_PROBABILITY) {
    return { fire: true, reason: `random (${roll.toFixed(2)})` };
  }
  return { fire: false, reason: `skipped (roll=${roll.toFixed(2)})` };
}

// Open Cowork in a hidden window: positioned far off-screen so the user never sees it,
// but in "normal" state so Chrome's throttling doesn't apply.
//   - background tabs in active window  throttled  Cowork SPA never finishes loading
//   - minimized windows                  throttled  same problem
//   - off-screen "normal" windows        NOT throttled and NOT visible  
async function openCoworkWindow(url) {
  const win = await chrome.windows.create({
    url,
    focused: false,
    state: "normal",
    type: "normal",
    left: 20000,
    top: 20000,
    width: 1280,
    height: 800,
  });
  try {
    await chrome.windows.update(win.id, {
      focused: false,
      state: "normal",
      left: 20000,
      top: 20000,
      width: 1280,
      height: 800,
    });
  } catch (_) {}
  const tab = win.tabs && win.tabs[0];
  return { winId: win.id, tabId: tab && tab.id };
}

async function openCoworkWindowVisible(url) {
  const win = await chrome.windows.create({
    url, focused: true, state: "normal", type: "normal", width: 1280, height: 800,
  });
  const tab = win.tabs && win.tabs[0];
  return { winId: win.id, tabId: tab && tab.id };
}

async function fire(opts) {
  const debug = opts && opts.debug;
  const prompts = await loadPrompts();
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const { winId, tabId } = debug
    ? await openCoworkWindowVisible(COWORK_URL)
    : await openCoworkWindow(COWORK_URL);
  if (!tabId) throw new Error("no tabId from window");

  // Stash the prompt for the content script to pick up
  await chrome.storage.session.set({ [`pending_${tabId}`]: prompt, [`win_${tabId}`]: winId });

  // Pre-record as " fire-result message from content.js will mark ok:true/falsepending" 
  const state = await getState();
  const today = todayKey();
  state.history[today] = state.history[today] || [];
  const entry = { ts: Date.now(), prompt, ok: null, tabId };
  state.history[today].push(entry);
  // trim 30 days
  const cutoff = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
  for (const k of Object.keys(state.history)) {
    if (k < cutoff) delete state.history[k];
  }
  await setState(state);

  // Safety net: close the window after 90s no matter what
  setTimeout(async () => {
    try { await chrome.windows.remove(winId); } catch (_) {}
    try { await chrome.storage.session.remove([`pending_${tabId}`, `win_${tabId}`]); } catch (_) {}
  }, 90000);

  return { prompt, tabId, winId };
}

async function tick() {
  const state = await getState();
  const decision = await shouldFire(state);
  console.log("[CoworkGhost] tick:", decision);
  if (decision.fire) {
    try {
      const result = await fire();
      console.log("[CoworkGhost] fire dispatched:", result.prompt);
    } catch (e) {
      console.error("[CoworkGhost] fire error:", e);
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await setState(state);
  await chrome.alarms.create(TICK_ALARM, { periodInMinutes: TICK_INTERVAL_MIN, delayInMinutes: 1 });
  console.log("[CoworkGhost] installed");
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create(TICK_ALARM, { periodInMinutes: TICK_INTERVAL_MIN, delayInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TICK_ALARM) tick();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "who-am-i") {
    sendResponse({ tabId: sender?.tab?.id });
    return false;
  }
  if (msg?.type === "close-self") {
    const id = msg.tabId ?? sender?.tab?.id;
    closeTabAndWindow(id);
    sendResponse({ ok: true });
    return false;
  }
  if (msg?.type === "fire-result") {
    handleFireResult(msg).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.type === "manual-fire") {
    fire({ debug: !!msg.debug }).then(r => sendResponse({ ok: true, prompt: r.prompt }))
          .catch(e => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg?.type === "get-status") {
    getState().then((state) => {
      const today = todayKey();
      const todayHist = state.history[today] || [];
      const todayCount = todayHist.filter(e => e.ok !== false).length;
      sendResponse({
        enabled: state.enabled,
        dailyTarget: state.dailyTarget,
        todayCount,
        todayHistory: todayHist,
        workHours: isWorkHours(),
      });
    });
    return true;
  }
  if (msg?.type === "set-enabled") {
    getState().then(async (state) => {
      state.enabled = !!msg.enabled;
      await setState(state);
      sendResponse({ ok: true });
    });
    return true;
  }
});

async function handleFireResult(msg) {
  const state = await getState();
  const today = todayKey();
  const list = state.history[today] || [];
  // Update most recent matching entry
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].tabId === msg.tabId || list[i].prompt === msg.prompt) {
      list[i].ok = !!msg.ok;
      list[i].reason = msg.reason || null;
      break;
    }
  }
  state.history[today] = list;
  await setState(state);
}

async function closeTabAndWindow(tabId) {
  if (!tabId) return;
  try {
    const stash = await chrome.storage.session.get(`win_${tabId}`);
    const winId = stash[`win_${tabId}`];
    if (winId) {
      await chrome.windows.remove(winId).catch(() => {});
    } else {
      await chrome.tabs.remove(tabId).catch(() => {});
    }
    await chrome.storage.session.remove([`pending_${tabId}`, `win_${tabId}`]).catch(() => {});
  } catch (_) {}
}
