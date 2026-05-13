async function refresh() {
  const status = await chrome.runtime.sendMessage({ type: "get-status" });
  document.getElementById("enabled-toggle").checked = !!status.enabled;
  document.getElementById("today-count").textContent = status.todayCount + " / " + status.dailyTarget;
  document.getElementById("work-hours").textContent = status.workHours ? "Yes" : "No (paused)";
  const hist = document.getElementById("history");
  hist.innerHTML = "";
  (status.todayHistory || []).slice().reverse().forEach((h) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const t = new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const flag = h.ok === true ? "OK" : (h.ok === false ? "FAIL" : "...");
    div.textContent = t + " [" + flag + "] " + h.prompt;
    hist.appendChild(div);
  });
}

document.getElementById("enabled-toggle").addEventListener("change", async (e) => {
  await chrome.runtime.sendMessage({ type: "set-enabled", enabled: e.target.checked });
  refresh();
});

document.getElementById("fire-btn").addEventListener("click", async () => {
  const btn = document.getElementById("fire-btn");
  btn.disabled = true;
  btn.textContent = "Firing...";
  const r = await chrome.runtime.sendMessage({ type: "manual-fire" });
  btn.textContent = r.ok ? ("Fired: " + r.prompt.slice(0, 30)) : ("Failed: " + r.error);
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "Fire one now";
    refresh();
  }, 3000);
});

document.getElementById("debug-btn").addEventListener("click", async () => {
  const btn = document.getElementById("debug-btn");
  btn.disabled = true;
  btn.textContent = "Debug firing...";
  const r = await chrome.runtime.sendMessage({ type: "manual-fire", debug: true });
  btn.textContent = r.ok ? ("Debug: " + r.prompt.slice(0, 30)) : ("Failed: " + r.error);
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "Debug fire (visible)";
    refresh();
  }, 3000);
});

refresh();
