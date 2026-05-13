// Cowork Ghost — background service worker
// Schedules randomized workday firings of safe Cowork prompts.

const COWORK_URL = "https://m365.cloud.microsoft/chat/agent/T_7e151bfa-7eaa-0802-049f-5d3b98c95e04.weave";
const TICK_ALARM = "cowork-ghost-tick";
const TICK_INTERVAL_MIN = 30; // check every 30 min
const DEFAULT_DAILY_TARGET = 5;
const FIRE_PROBABILITY = 0.28; // tuned so ~5 fires across ~16 ticks/day
const WORK_HOURS = { startH: 8, endH: 19 }; // local time, weekdays

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
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function isWorkHours() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  // Israel work week: Sun-Thu (0-4). Adjust if needed.
  if (day === 5 || day === 6) return false;
  const h = d.getHours();
  return h >= WORK_HOURS.startH && h < WORK_HOURS.endH;
}

async function shouldFire(state) {
  if (!state.enabled) return { fire: false, reason: "disabled" };
  if (!isWorkHours()) return { fire: false, reason: "outside work hours" };
  const today = todayKey();
  const todayCount = (state.history[today] || []).length;
  if (todayCount >= state.dailyTarget) {
    return { fire: false, reason: `target reached (${todayCount}/${state.dailyTarget})` };
  }
  // Force-fire if we're behind schedule late in the day
  const h = new Date().getHours();
  const hoursLeft = WORK_HOURS.endH - h;
  const stillNeed = state.dailyTarget - todayCount;
  if (hoursLeft <= 2 && stillNeed > 0) {
    return { fire: true, reason: "catch-up (end of day)" };
  }
  // Random gate
  const roll = Math.random();
  if (roll < FIRE_PROBABILITY) {
    return { fire: true, reason: `random (${roll.toFixed(2)})` };
  }
  return { fire: false, reason: `skipped (roll=${roll.toFixed(2)})` };
}

async function fire() {
  const prompts = await loadPrompts();
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Open Cowork in a background tab (does not steal focus)
  const tab = await chrome.tabs.create({ url: COWORK_URL, active: false });

  // Stash the prompt so the content script can pick it up
  await chrome.storage.session.set({ [`pending_${tab.id}`]: prompt });

  // Update history immediately to avoid double-counting on retries
  const state = await getState();
  const today = todayKey();
  state.history[today] = state.history[today] || [];
  state.history[today].push({ ts: Date.now(), prompt });
  // Trim history to last 30 days
  const cutoff = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
  for (const k of Object.keys(state.history)) {
    if (k < cutoff) delete state.history[k];
  }
  await setState(state);

  // Auto-close the tab after 30s as a safety net
  setTimeout(() => {
    chrome.tabs.remove(tab.id).catch(() => {});
    chrome.storage.session.remove(`pending_${tab.id}`).catch(() => {});
  }, 30000);

  return { prompt, tabId: tab.id };
}

async function tick() {
  const state = await getState();
  const decision = await shouldFire(state);
  console.log("[CoworkGhost] tick:", decision);
  if (decision.fire) {
    try {
      const result = await fire();
      console.log("[CoworkGhost] fired:", result.prompt);
    } catch (e) {
      console.error("[CoworkGhost] fire error:", e);
    }
  }
}

// Bootstrap
chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await setState(state); // ensure exists
  await chrome.alarms.create(TICK_ALARM, {
    periodInMinutes: TICK_INTERVAL_MIN,
    delayInMinutes: 1,
  });
  console.log("[CoworkGhost] installed");
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create(TICK_ALARM, {
    periodInMinutes: TICK_INTERVAL_MIN,
    delayInMinutes: 1,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TICK_ALARM) tick();
});

// Manual fire trigger from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "who-am-i") {
    sendResponse({ tabId: _sender?.tab?.id });
    return false;
  }
  if (msg?.type === "close-self") {
    const id = msg.tabId ?? _sender?.tab?.id;
    if (id) chrome.tabs.remove(id).catch(() => {});
    sendResponse({ ok: true });
    return false;
  }
  if (msg?.type === "manual-fire") {
    fire().then((r) => sendResponse({ ok: true, prompt: r.prompt }))
          .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // async
  }
  if (msg?.type === "get-status") {
    getState().then((state) => {
      const today = todayKey();
      const todayCount = (state.history[today] || []).length;
      sendResponse({
        enabled: state.enabled,
        dailyTarget: state.dailyTarget,
        todayCount,
        todayHistory: state.history[today] || [],
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
